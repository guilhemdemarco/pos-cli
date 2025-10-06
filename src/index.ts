import prompts from "prompts"
import { addProduct, adjustStock, deleteProduct, findProductById, listProducts, seedProducts, updateProduct } from "./services/ProductService"
import { authenticate } from "./services/UserService"
import type { User } from "./models/User"
import type { Product } from "./models/Product";
import { generateEAN13 } from "./utils/ean";
import { cashierMode } from "./cashier";
import { selectProduct } from "./utils/selectProducts";
import enUS from "../locales/en-us.json";
import frFR from "../locales/fr-fr.json"
import { openSales } from "./services/SaleService";

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

async function main() {

    seedProducts()

    openSales()
    const user = await login();
    if (!user) return


    while (true){
        const choices = user.role === 'admin'
        ? [
            { title: t('main.menu.sale'), value: 'sale' },
            { title: t('main.menu.inventory'), value: 'inventory' },
            { title: t('main.menu.exit'), value: 'exit' }
        ]
        : [
            { title: t('main.menu.sale'), value: 'sale' },
            { title: t('main.menu.exit'), value: 'exit' }
        ];

        const {action} = await prompts({
            type: "select",
            name: 'action',
            message: t('main.menu.prompt'),
            choices
        })

        if (action === "add" && user.role === "admin"){
            const response = await prompts([
                {type: "text", name: "name", message: t('inventory.create.name')},
                {type: "number", name: "price", message: t('inventory.create.price')}
            ])

            //addProduct({id: crypto.randomUUID(), ...response})
        }

        if (action === "sale") {
            await cashierMode(user)
        }

        if (action === 'inventory' && user.role === "admin") {
            await manageInventory()
        }

        if (action === "list" && user.role === "admin"){
            console.log(listProducts())
        }

        if (action === "exit") {
            console.log(t('main.menu.goodbye'))
            break
        }
    }
}

async function login(): Promise<User | null> {
    const credentials = await prompts([
        { type: 'text', name: 'username', message: t('login.username') },
        { type: 'password', name: 'password', message: t('login.password') }
      ]);
    
      const user = authenticate(credentials.username, credentials.password);
      if (!user) {
        console.log(t('login.invalid'));
        return null;
      }
    
      console.log(t('login.success', { username: user.username, role: user.role }));
      return user;
}

async function manageInventory() {
    const { action } = await prompts({
        type: "select",
        name: "action",
        message: t('inventory.menu.title'),
        choices:[
            { title: t('inventory.menu.create'), value: "create" },
            { title: t('inventory.menu.edit'), value: "edit" },
            { title: t('inventory.menu.adjust'), value: "adjust" },
            { title: t('inventory.menu.delete'), value: "delete" },
            { title: t('inventory.menu.back'), value: "back" }
        ]
    })
    
    if (action === "create"){
        const response = await prompts([
            {type: "text", name: "name", message: t('inventory.create.name')},
            {type: "text", name: "price", message: t('inventory.create.price'),
                validate: value => {
                const parsed = parseFloat(String(value).replace(",", "."));
                return isNaN(parsed) || parsed < 0 ? "Enter a valid positive number" : true;
              },
              format: value => parseFloat(String(value).replace(",", "."))},
            {type: "number", name: "stock", message: t('inventory.create.stock')},
        ])

        const newProduct: Product = {
            id: generateEAN13(),
            name: response.name,
            price: response.price,
            stock: response.stock
        }

        addProduct(newProduct)
        console.log(t('inventory.create.success'), newProduct)
    }

    if (action === "edit"){
        const selectedId = await selectProduct();

        const product = findProductById(selectedId)
        if (!product){
            console.log(t('inventory.edit.notfound'))
            return
        }

        const updates = await prompts([
            { type: "text", name: "name", message: t('inventory.edit.name', { name: product.name }), initial: product.name },
            {
                type: "text",
                name: "price",
                message: t('inventory.edit.price', { price: product.price }),
                initial: product.price,
                validate: value => {
                  const parsed = parseFloat(String(value).replace(",", "."));
                  return isNaN(parsed) || parsed < 0 ? "Enter a valid positive number" : true;
                },
                format: value => parseFloat(String(value).replace(",", "."))
              },
            { type: "number", name: "stock", message: t('inventory.edit.stock', { stock: product.stock }), initial: product.stock }
        ]);

        updateProduct(product.id, updates);
        console.log(t('inventory.edit.success'));
    }

    if (action === "adjust"){
        const selectedId = await selectProduct()

        const { delta } = await prompts({
            type: "number",
            name: "delta",
            message: t('inventory.adjust.prompt')
        })

        const success = adjustStock(selectedId, delta)
        console.log(success ? t('inventory.adjust.success') : t('inventory.adjust.fail'))
    }

    if (action === "delete"){
        const selectedId = await selectProduct()

        const confirm = await prompts({
            type: "confirm",
            name: "sure",
            message: t('inventory.delete.confirm'),
            initial: false
        })

        if (confirm.sure){
            const deleted = deleteProduct(selectedId)
            console.log(deleted ? t('inventory.delete.success') : t('inventory.delete.fail'))
        }
        else {
            console.log(t('inventory.delete.cancel'))
        }
    }
}



main()
