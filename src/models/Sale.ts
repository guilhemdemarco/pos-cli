export interface SaleItem{
    productId: string,
    quantity: number
}

export interface Sale{
    id: string,
    items: SaleItem[],
    total: number,
    date: string
}