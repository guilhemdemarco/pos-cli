import prompts from "prompts";
import { listProducts } from "../services/ProductService";

export async function selectProduct(){
    const allProducts = listProducts()

    if (allProducts.size === 0) {
        console.log("No products available.")
        return
    }

    const { selectedId } = await prompts({
        type: "select",
        name: "selectedId",
        message: "Select a product to edit: ",
        choices: Array.from(allProducts.entries()).map(([key, product]) => ({
            title: `${product.name} (Stock: ${product.stock}) [${product.id}]`,
            value: key
        }))
    });

    return selectedId
}