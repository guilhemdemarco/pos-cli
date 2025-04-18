export interface Product {
    id: string,
    name: string,
    price: number
    stock: number
}

export function formatProduct(product: Product): string {
    return `${product.name} - €${product.price.toFixed(2)} (Stock: ${product.stock}) [${product.id}]`;
}

