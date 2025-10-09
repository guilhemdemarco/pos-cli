import prompts from "prompts";
import type { Product } from "./models/Product";
import { findProductById, updateProduct } from "./services/ProductService";
import { selectProduct } from "./utils/selectProducts";
import enUS from "../locales/en-us.json";
import frFR from "../locales/fr-fr.json"
import { openSales, recordSale } from "./services/SaleService";
import type { User } from "./models/User";

interface CartItem{
    product: Product,
    quantity: number
}

// Simple localization function with variable interpolation
function t(key: string, vars?: Record<string, string | number>) {
    let str = (frFR as any)[key] || key;
    if (vars) {
        for (const [k, v] of Object.entries(vars)) {
            str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
    }
    return str;
}

export async function cashierMode(cashier: User) {
    const salesOpened = await openSales()
    if (!salesOpened) return
    const cart: CartItem[] = []

    let lastAddedIndex: number | null = null;

    const getLastIndex = () => lastAddedIndex;
    const setLastIndex = (index: number | null) => {
        lastAddedIndex = index;
    };

    while (true){
        console.clear()
        printCart(cart)

        const {input} = await prompts({
            type: "text",
            name: "input",
            message: t("cashier.scan_or_command")
        })

        if (!input) continue

        if (input.startsWith(":")){
            const [cmd, ...args] = input.slice(1).trim().split(" ")
            const handled = await handleCommand(cmd, args, cart, getLastIndex, setLastIndex, cashier)
            if (handled === "quit") break
            continue
        }

        const product = findProductById(input)
        if (!product){
            console.log(t("cashier.product_not_found"))
            await pause()
            continue
        }

        const existingIndex = cart.findIndex(item => item.product.id === product.id)
        if (existingIndex >= 0) {
            cart[existingIndex].quantity += 1
            lastAddedIndex = existingIndex
        } else {
            cart.push({ product, quantity: 1 })
            lastAddedIndex = cart.length - 1
        }
    }
}

function printCart(cart: CartItem[]){
    console.log(t("cashier.cart_title"));
    if (cart.length === 0) {
        console.log(t("cashier.cart_empty"));
        return;
    }
  
    cart.forEach((item, i) => {
        const total = item.quantity * item.product.price;
        console.log(
            t("cashier.cart_line", {
                index: i + 1,
                name: item.product.name,
                quantity: item.quantity,
                total: total.toFixed(2)
            })
        );
    });
  
    const total = cart.reduce((sum, item) => sum + item.quantity * item.product.price, 0);
    console.log(t("cashier.cart_total", { total: total.toFixed(2) }));
}

async function handleCommand(cmd: string,
    args: string[],
    cart: CartItem[],
    getLastIndex: () => number | null,
    setLastIndex: (index: number | null) => void,
    cashier: User
): Promise<"ok" | "quit"> {
    switch (cmd){
        case "q":
        case "quit":
            return "quit";
        
        case "co":
        case "checkout":{
            if (cart.length === 0){
                console.log("Cart is empty")
                await pause()
                return 'ok'
            }

            console.log("Checking stock...")
            for (const item of cart){
                if (item.quantity > item.product.stock){
                    console.log(`Not enough stock for ${item.product.name}`)
                    await pause()
                    return "ok"
                }
                else{
                    updateProduct(item.product.id, {
                        stock: item.product.stock - item.quantity
                    })
                }
            }

            const saleItems = cart.map(item => ({
                productId: item.product.id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity
            }));

            
            const sale = recordSale(saleItems, cashier)
            console.log("\n Sale recorded!");
            console.log(`Sale ID: ${sale.id}`);
            console.log(`Time: ${sale.timestamp}`);
            console.log(`Total: €${sale.total.toFixed(2)}\n`);

            cart.length = 0
            setLastIndex(null)

            await pause()
            return "ok"
        }

        
        case "rm":{
            const index = args[0] ? parseInt(args[0]) - 1 : getLastIndex() 
            if (index === null || isNaN(index) || !cart[index]){
                console.log(t("cashier.invalid_item_number"))
                await pause()
                return "ok"
            }

            const removed = cart.splice(index, 1)
            console.log(t("cashier.removed_from_cart", { name: removed[0].product.name }))
            //await pause()
            return 'ok'
        }

        case "set": {
            const qty = parseInt(args[0]);
            const index = args[1] ? parseInt(args[1]) - 1 : getLastIndex();

            if (isNaN(qty) || qty < 0 || index === null || isNaN(index) || !cart[index]) {
                console.log(t("cashier.set_usage"));
                await pause();
                return "ok";
            }

            if (qty === 0) {
                cart.splice(index, 1);
                console.log(t("cashier.removed_item"));
            } else {
                cart[index].quantity = qty;
                console.log(t("cashier.set_quantity", { qty, name: cart[index].product.name }));
            }
            //await pause();
            return "ok";
        }

        case "li":
        case "list": {
            const selectedId = await selectProduct()
            if (!selectedId){
                console.log(t("cashier.no_product_selected"))
                await pause()
                return "ok"
            }

            const product = findProductById(selectedId)
            if (!product){
                console.log(t("cashier.product_not_found"))
                await pause()
                return 'ok'
            }

            const existingIndex = cart.findIndex(item => item.product.id === product.id);
            if (existingIndex >= 0) {
                cart[existingIndex].quantity += 1;
                console.log(t("cashier.increased_quantity", { name: product.name }))
                // update last added index
                setLastIndex(existingIndex)
            } else {
                cart.push({ product, quantity: 1 })
                console.log(t("cashier.added_to_cart", { name: product.name }))
                setLastIndex(cart.length - 1)
            }

            //await pause()
            return "ok"
        }

        case "help": {
            console.log(t("cashier.help_title"));
            console.log(t("cashier.help_checkout"));
            console.log(t("cashier.help_cancel"));
            console.log(t("cashier.help_remove"));
            console.log(t("cashier.help_list"));
            console.log(t("cashier.help_set"));
            console.log(t("cashier.help_help"));
            await pause();
            return "ok";
        }

        default:
            console.log(t("cashier.unknown_command", { cmd }));
            await pause();
            return "ok";
    }
}

async function pause(){
    await prompts({
        type: "confirm",
        name: "continue",
        message: t("cashier.press_enter"),
        initial: true
    });
}
