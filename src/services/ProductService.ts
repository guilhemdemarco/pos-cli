import type { Product } from "../models/Product";

let products: Map<string, Product> = new Map()

export function addProduct(product: Product){
    products.set(product.id, product)
    saveProducts()
}

export function listProducts(): Map<string, Product>{
    return products
}

export function findProductById(id: string): Product | undefined{
    return products.get(id)
}

export function updateProduct(id: string, data: Partial<Omit<Product, "id">> ): boolean{
    const product = products.get(id)
    if (!product) return false

    if (data.name !== undefined) product.name = data.name;
    if (data.price !== undefined) product.price = data.price;
    if (data.stock !== undefined) product.stock = data.stock;

    products.set(product.id, product)
    saveProducts()
    return true
}

export function adjustStock(id: string, delta: number): boolean {
    const product = products.get(id);
    if (!product) return false;

    const newStock = product.stock + delta;
    if (newStock < 0) return false; // Prevent negative stock

    product.stock = newStock;

    saveProducts()
    return true;
}

export function deleteProduct(id: string): boolean {
    let deleteProduct = products.delete(id);
    saveProducts()
    return deleteProduct
}

export function seedProducts() {
    const sampleProducts: Product[] = [
        {
            id: "4006381333931", 
            name: "Gummy Bears",
            price: 1.99,
            stock: 100
        },
        {
            id: "5000159484695", 
            name: "Coca-Cola 500ml",
            price: 1.5,
            stock: 200
        },
        {
            id: "3057640257772", 
            name: "Baguette",
            price: 1.1,
            stock: 50
        },
        {
            id: "3222476497573", 
            name: "Camembert",
            price: 3.6,
            stock: 25
        },
        {
            id: "7613035308940", 
            name: "Chocolate Bar",
            price: 2.2,
            stock: 80
        }
    ];
  
    for (const product of sampleProducts) {
        addProduct(product);
    }

    saveProducts()
  
    console.log("Sample products seeded.");
}

async function saveProducts(){
    //todo: use sqlite instead
    //console.log("save ", products)
    await Bun.write("data/products.json", JSON.stringify(Array.from(products.entries())))
    //console.log("saved ", products)
}

export async function openProducts(){
    let productsFile = Bun.file("data/products.json", {type: "application/json"})
    if (! (await productsFile.exists())){
        await seedProducts()
        // try again
        productsFile = Bun.file("data/products.json", {type: "application/json"})
    }
    let productsMap = await productsFile.json()
    products = new Map<string, Product>(productsMap)
}