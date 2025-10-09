import { generateHash, PUBLIC_KEY, signHash, type Closure, type NF525Log, type Sale, type SaleItem, type Signature } from "../models/Sale";
import {createHash, createSign, createVerify, Sign} from "crypto"
import type { User } from "../models/User";

let sales: Sale[] = []
let nf525Log: NF525Log[] = []
let signatures: Signature[] = []


export function recordSale(items: SaleItem[], cashier: User):Sale {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const timestamp = new Date().toISOString()

    const previous_hash = nf525Log.length > 0 ? nf525Log[nf525Log.length - 1].hash : "ROOT"
    const sale_id = String(sales.length + 1)

    const saleDataToHash = {
        id: sale_id,
        timestamp,
        items,
        total,
        userId: cashier.id,
        previous_hash
    }

    const hash = generateHash(saleDataToHash)
    // console.log(typeof nf525Log)
    const nflog: NF525Log = {
        sale_id,
        hash
    }
    nf525Log.push(nflog)

    const hash_signature = signHash(hash)
    const signature: Signature = {
        hash: hash,
        signature: hash_signature,
        public_key_id: PUBLIC_KEY
    }
    signatures.push(signature)

    const sale: Sale = {
        ...saleDataToHash,
        signature: hash_signature,
        hash
    }

    sales.push(sale)
    saveSales()
    return sale
}



export function getSales(): Sale[]{
    return sales
}

export function getNF525Log(): NF525Log[]{
    return nf525Log
}

async function saveSales(){
    // TODO: use sqlite instead
    await Bun.write("data/"+ getCurrentDay() +".json", JSON.stringify(sales))
    await Bun.write("data/log.json", JSON.stringify(nf525Log))
}

export async function openSales(): Promise<boolean>{
    const salesDayPath = "data/" + getCurrentDay() + ".json"
    const salesLogPath = "data/slog.json"
    //TODO: sqlite too
    let salesFile = Bun.file(salesDayPath, {type:"application/json"})
    let logFile = Bun.file(salesLogPath, {type: "application/json"})

    if (await isDayClosed()){
        console.log("Fiscal day has been closed. You cannot open a sale.")
        return false
    }

    if (!(await salesFile.exists())) {
        console.log("Fiscal day has not been opened yet. Please contact an administrator.")
        return false
        // await Bun.write(salesDayPath, "[]")
        // // try again or it wont read the file properly
        // salesFile = Bun.file(salesDayPath, {type:"application/json"})
    }    
    if (!(await logFile.exists())) {
        await Bun.write(salesLogPath, "[]")
        logFile = Bun.file(salesLogPath, {type: "application/json"})
    }
    
    sales = await salesFile.json()
    nf525Log = await logFile.json()
    return true
}

export async function isDayOpen():Promise<boolean>{
    return await Bun.file("data/"+getCurrentDay()+".json").exists()
}

export async function isDayClosed():Promise<boolean>{
    return await Bun.file("data/"+"Z-"+getCurrentDay()+".json").exists()
}

export async function openDay(){
    console.log("Opening fiscal day " + getCurrentDay())
    await Bun.write("data/"+ getCurrentDay()+".json", "[]" )
    console.log("Fiscal day successfully opened!")
}

export async function closeDay(){
    console.log("Closing fiscal day " + getCurrentDay())
    const closurePath = "data/" + getCurrentDay() + ".json"
    const zclosurePath = "data/" + "Z-" +getCurrentDay() + ".json"
    const closureLogPath = "data/clog.json"
    
    const closureFile = Bun.file(closurePath, {type:"application/json"})
    const closureLogFile = Bun.file(closureLogPath, {type:"application/json"})

    if (!closureFile.exists()) throw new Error("Cannot close fiscal day as it hasn't been opened.")
    const todaySales: Sale[] = await closureFile.json()

    let closureLog: string[] = []
    if ( !(await closureLogFile.exists())){
        console.log("Creating clog file")
        await Bun.write(closureLogPath, "[]")
    } else {const closureLog = await closureLogFile.json()}

    const previous_hash: string = closureLog.length > 0 ? closureLog[closureLog.length - 1] : "ROOT"
    const closure_id = String(todaySales.length + 1)
    let total_sales_count = 0
    let total = 0
    todaySales.forEach(sale => {
        total_sales_count++
        total += sale.total
    })

    const closureToHash = {
        closure_id,
        date: new Date().toISOString(),
        total_sales_count,
        total,
        start_hash: todaySales[0].hash,
        end_hash: todaySales[todaySales.length - 1].hash,
        previous_hash,
    }

    const closureHash = generateHash(closureToHash)
    closureLog.push(closureHash)
    await Bun.write(closureLogPath,JSON.stringify(closureHash))

    const closureData: Closure = {
        ...closureToHash,
        hash: closureHash
    }

    await Bun.write(zclosurePath, JSON.stringify(closureData))

    console.log("Fiscal day successfully closed!")
    console.log("Closure id ", closure_id)
    console.log("Total sales: ", total_sales_count, total)

}

function getCurrentDay(): string{
    return new Date().toISOString().substring(0,10)
}
