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
    previous_hash: string;
}
