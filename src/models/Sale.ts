import { createHash, createSign, createVerify } from "crypto";

export interface SaleItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Sale {
    id: string;
    timestamp: string;
    userId: string;
    items: SaleItem[];
    total: number;
    hash: string;
    signature: string
    previous_hash: string;
}

export interface NF525Log {
    sale_id: string,
    hash: string
}

export interface Signature {
    hash: string,
    signature: string,
    public_key_id: string
}

// --- Utility for checking if sale is valid

export const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
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

export function generateHash(data: any): string {
    const stringified = JSON.stringify(data, Object.keys(data).sort());
    return createHash("sha256").update(stringified).digest("hex");
}

export function signHash(hash: string): string {
    const signer = createSign("RSA-SHA256")
    signer.update(hash)
    signer.end()
    const signature = signer.sign(PRIVATE_KEY)
    return signature.toString("base64")
}

export function verifySignature(hash: string, signature: string): boolean{
    const verifier = createVerify("RSA-SHA256")
    verifier.update(hash)
    verifier.end()
    return verifier.verify(PUBLIC_KEY, Buffer.from(signature, "base64"))
}

export function verifySale(sale: Sale, previous_sale: Sale | undefined): boolean{
    console.log("Checking sale", sale.id, sale.timestamp)
    const {id, timestamp, userId, items, total, previous_hash} = sale
    const stripped_sale = {
        id,
        timestamp,
        items,
        total,
        userId,
        previous_hash
    }
    const recalculated_hash = generateHash(stripped_sale)

    if (recalculated_hash !== sale.hash) {
        console.error("❌ Hash mismatch - sale data was modified");
        return false;
    }

    if (!verifySignature(sale.hash, sale.signature)){
        console.error("❌ Invalid signature - sale not signed by trusted key");
        return false;
    }

    if (previous_sale && sale.previous_hash !== previous_sale.hash){
        console.error("❌ Hash chain broken - sale not linked properly");
        return false;
    }

    if (previous_sale && new Date(sale.timestamp) < new Date(previous_sale.timestamp)){
        console.error("⚠️ Timestamp anomaly - sale appears out of order");
    }

    console.log("✅ Sale is valid");
    return true
}