import { generateHash, PUBLIC_KEY, signHash, type NF525Log, type Sale, type SaleItem, type Signature } from "../models/Sale";
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
    await Bun.write("data/sales.json", JSON.stringify(sales))
    await Bun.write("data/log.json", JSON.stringify(nf525Log))
}

export async function openSales(){
    //TODO: sqlite too
    let salesFile = Bun.file("data/sales.json", {type:"application/json"})
    let logFile = Bun.file("data/log.json", {type: "application/json"})
    
    if (!(await salesFile.exists())) {
        await Bun.write("data/sales.json", "[]")
        // try again or it wont read the file properly
        salesFile = Bun.file("data/sales.json", {type:"application/json"})
    }    
    if (!(await logFile.exists())) {
        await Bun.write("data/log.json", "[]")
        logFile = Bun.file("data/log.json", {type: "application/json"})
    }
    
    sales = await salesFile.json()
    nf525Log = await logFile.json()
}