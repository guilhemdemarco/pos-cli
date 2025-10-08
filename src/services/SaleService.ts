import type { NF525Log, Sale, SaleItem, Signature } from "../models/Sale";
import {createHash, createSign, createVerify, Sign} from "crypto"
import type { User } from "../models/User";

let sales: Sale[] = []
let nf525Log: NF525Log[] = []
let signatures: Signature[] = []

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGeMA0GCSqGSIb3DQEBAQUAA4GMADCBiAKBgGAZlHx0/W76pdALCrjDhIX/90s1
wWn6bpKKU7Yt4mpAkeMN3lDVwOQNGi9pYsiF6gWhmcK7Yk4Yd+cXmdXU1UbtShNT
9bQUY9gI2Vmw0HAddOVDwSopDRHZREILt1Xd15z9sgLNaeQFH9429xIdyWLtdA2T
xOIoVPmqLYZVSAqVAgMBAAE=
-----END PUBLIC KEY-----`
// TODO: DO NOT KEEP THIS HERE THIS IS VERY BAD FOR SECURITY BUT THIS IS A PROTOTYPE SO IDC
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIICWgIBAAKBgGAZlHx0/W76pdALCrjDhIX/90s1wWn6bpKKU7Yt4mpAkeMN3lDV
wOQNGi9pYsiF6gWhmcK7Yk4Yd+cXmdXU1UbtShNT9bQUY9gI2Vmw0HAddOVDwSop
DRHZREILt1Xd15z9sgLNaeQFH9429xIdyWLtdA2TxOIoVPmqLYZVSAqVAgMBAAEC
gYBThYfvD0LAtKluAlrEMHG6gLfuLv8124lEZWLSIFj7HbltjD0fJlgqHFUYxdAs
FW9Ki6P2giOzWkLDn1h9ZyghFyY1iYSjneuGvO7a8GXLA72EtRT1Nc2A0T3j8L3o
d8EmlOkLoGHjonVCRHQF2bgg6bWqgMDdTs17Nwx13OieAQJBAJ+K01glc7yJgOwb
BvYYMT+Hxets5eYw/W5WaqhLh0/jmgwYxdAwmkdPfOViVRL9L0xgmYKNQqa/pbwd
rtlAihUCQQCaM3SkWJJ9jBtTLFbSm+WsA0vNMhW/wxVRVsOD+H77SYIUCpO/kQLI
BqACOuEbXUVjNi04HFZAoVwEf+umRB6BAkAMAaKOC6N+GMr++bm4Y3GxWkJmyTcz
75Pi7dXw/F4egP5i0qpwVHgHzc+UY6YLW8pncQ2caY0Oh3Wthn5WEylRAkAx11Xp
VROsbt/aJ2e81VUMH1id74VmISk/zDqP6n8ou97GmZCeB8INY07Oybc/AAvQgI9n
JomehElYzvwdFsGBAkB4XJmHjrcNZc/4YKF9NZ3v1tLR3V809d4t957BCCYuupUA
bPjlAKQtBcZfu9dsYk5nlFP+g/7v33P/MKn+yqDR
-----END RSA PRIVATE KEY-----`

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
        signature,
        hash
    }

    sales.push(sale)
    saveSales()
    return sale
}

function generateHash(data: any): string {
    const stringified = JSON.stringify(data, Object.keys(data).sort());
    return createHash("sha256").update(stringified).digest("hex");
}

function signHash(hash: string): string {
    const signer = createSign("RSA-SHA256")
    signer.update(hash)
    signer.end()
    const signature = signer.sign(PRIVATE_KEY)
    return signature.toString("base64")
}

function verifySignature(hash: string, signature: string): boolean{
    const verifier = createVerify("RSA-SHA256")
    verifier.update(hash)
    verifier.end()
    return verifier.verify(PUBLIC_KEY, Buffer.from(signature, "base64"))
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