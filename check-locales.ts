const enUS_file = Bun.file("locales/en-us.json")
const frFR_file = Bun.file("locales/fr-fr.json")

const enUS: Map<string, string> = await enUS_file.json()
const frFR: Map<string, string>  = await frFR_file.json()
//console.log("enUS",enUS)
//console.log("frFR", frFR)

let en_values = []
for(let value in enUS){
    en_values.push(value)
}
//console.log("EN values", en_values)

let fr_values = []
for (let valuee in frFR){
    fr_values.push(valuee)
}
//console.log("FR values", fr_values)

console.log(diff(en_values, fr_values))

function diff(arr1: string[], arr2: string[]): string[]{
    return arr1.filter(x => !arr2.includes(x))
}