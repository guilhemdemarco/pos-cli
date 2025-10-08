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
    signature: Signature
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