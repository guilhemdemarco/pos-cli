import type { Sale, SaleItem } from "../models/Sale";
import {createHash} from "crypto"
import type { User } from "../models/User";

const sales: Sale[] = []
const nf525Log: string[] = []

export function recordSale(items: SaleItem[], cashier: User):Sale {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const timestamp = new Date().toISOString()

    

    const previous_hash = nf525Log.length > 0 ? nf525Log[nf525Log.length - 1] : "ROOT"

    const saleDataToHash = {
        id: String(sales.length + 1),
        timestamp,
        items,
        total,
        userId: cashier.id,
        previous_hash
    }

    const hash = generateHash(saleDataToHash)
    
    nf525Log.push(hash)

    const sale: Sale = {
        ...saleDataToHash,
        hash
    }

    sales.push(sale)
    return sale
}

function generateHash(data: any): string {
    const stringified = JSON.stringify(data, Object.keys(data).sort());
    return createHash("sha256").update(stringified).digest("hex");
}

export function getSales(): Sale[]{
    return sales
}

export function getNF525Log(): string[]{
    return nf525Log
}