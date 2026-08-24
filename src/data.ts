import type { Category, Product } from "./types";

export const catalog: Product[] = [
  { id:"mother-milk", name:"Milk", normalizedName:"milk", category:"Dairy", size:"1 L", unit:"litre", price:56, inStock:true, tags:["toned"], substituteIds:["sofit-almond"] },
  { id:"sofit-almond", name:"Almond milk", normalizedName:"almond milk", category:"Dairy", size:"1 L", unit:"litre", price:295, inStock:true, tags:["vegan","lactose-free"], substituteIds:["mother-milk"] },
  { id:"farm-eggs", name:"Eggs", normalizedName:"egg", category:"Dairy", size:"6 pieces", unit:"piece", price:72, inStock:true, tags:["protein"] },
  { id:"harvest-bread", name:"Bread", normalizedName:"bread", category:"Bakery", size:"450 g", unit:"packet", price:55, inStock:true, tags:["whole-wheat"], substituteIds:["brown-bread"] },
  { id:"tata-salt", name:"Salt", normalizedName:"salt", category:"Pantry", size:"1 kg", unit:"packet", price:28, inStock:true, tags:["iodized"] },
  { id:"madhur-sugar", name:"Sugar", normalizedName:"sugar", category:"Pantry", size:"1 kg", unit:"packet", price:54, inStock:true, tags:[] },
  { id:"aashirvaad-atta", name:"Atta", normalizedName:"atta", category:"Pantry", size:"5 kg", unit:"packet", price:285, inStock:true, tags:["whole-wheat"] },
  { id:"fresh-besan", name:"Besan", normalizedName:"besan", category:"Grains", size:"1 kg", unit:"kilogram", price:95, inStock:true, tags:["gram-flour","protein","gluten-free"] },
  { id:"india-rice", name:"Basmati rice", normalizedName:"rice", category:"Pantry", size:"5 kg", unit:"packet", price:640, inStock:true, tags:["basmati"] },
  { id:"fortune-oil", name:"Cooking oil", normalizedName:"cooking oil", category:"Pantry", size:"1 L", unit:"bottle", price:148, inStock:true, tags:["sunflower"], onSale:true, originalPrice:170 },
  { id:"dabur", name:"Toothpaste", normalizedName:"toothpaste", category:"Personal Care", size:"200 g", unit:"piece", price:118, inStock:true, tags:["herbal"], onSale:true, originalPrice:135 },
  { id:"apple", name:"Apples", normalizedName:"apple", category:"Produce", size:"1 kg", unit:"kilogram", price:180, inStock:true, tags:["fruit","organic"], seasonalMonths:[7,8,9,10] },
  { id:"banana", name:"Bananas", normalizedName:"banana", category:"Produce", size:"6 pieces", unit:"piece", price:55, inStock:true, tags:["fruit"], seasonalMonths:[1,2,3,4,5,6,7,8,9,10,11,12] },
  { id:"mango", name:"Mangoes", normalizedName:"mango", category:"Produce", size:"1 kg", unit:"kilogram", price:160, inStock:true, tags:["fruit"], seasonalMonths:[4,5,6,7] },
  { id:"tomato", name:"Tomatoes", normalizedName:"tomato", category:"Produce", size:"1 kg", unit:"kilogram", price:48, inStock:true, tags:["vegetable"] },
  { id:"water", name:"Water", normalizedName:"water", category:"Beverages", size:"1 L", unit:"bottle", price:20, inStock:true, tags:[] },
  { id:"chips", name:"Potato chips", normalizedName:"chips", category:"Snacks", size:"90 g", unit:"packet", price:50, inStock:true, tags:["snack"] },
  { id:"dishwash", name:"Dishwash liquid", normalizedName:"dishwash liquid", category:"Household", size:"500 ml", unit:"bottle", price:115, inStock:true, tags:["cleaning"] },
  { id:"onion", name:"Onions", normalizedName:"onion", category:"Produce", size:"1 kg", unit:"kilogram", price:40, inStock:true, tags:["vegetable","healthy"] },
  { id:"spinach", name:"Spinach", normalizedName:"spinach", category:"Produce", size:"1 bunch", unit:"bunch", price:30, inStock:true, tags:["vegetable","healthy","iron"] },
  { id:"potato", name:"Potatoes", normalizedName:"potato", category:"Produce", size:"1 kg", unit:"kilogram", price:35, inStock:true, tags:["vegetable"] },
  { id:"bajra", name:"Bajra", normalizedName:"bajra", category:"Grains", size:"1 kg", unit:"kilogram", price:65, inStock:true, tags:["whole-grain","gluten-free"] },
  { id:"amul-butter", name:"Butter", normalizedName:"butter", category:"Dairy", size:"500 g", unit:"packet", price:285, inStock:true, tags:["dairy"], substituteIds:["nutralite","peanut-butter"] },
  { id:"nutralite", name:"Table spread", normalizedName:"table spread", category:"Dairy", size:"500 g", unit:"packet", price:210, inStock:true, tags:["lower-cost"], substituteIds:["amul-butter"] },
  { id:"peanut-butter", name:"Peanut butter", normalizedName:"peanut butter", category:"Pantry", size:"350 g", unit:"jar", price:199, inStock:true, tags:["high-protein","vegan"], substituteIds:["amul-butter"] },
  { id:"olive-oil", name:"Olive oil", normalizedName:"olive oil", category:"Pantry", size:"1 L", unit:"bottle", price:799, inStock:true, tags:["healthy"] },
  { id:"ice-cream", name:"Ice cream", normalizedName:"ice cream", category:"Frozen", size:"750 ml", unit:"tub", price:240, inStock:true, tags:["dessert"] },
  { id:"green-tea", name:"Green tea", normalizedName:"green tea", category:"Beverages", size:"25 bags", unit:"box", price:165, inStock:true, tags:["healthy","sugar-free"] },
  { id:"coconut-milk", name:"Coconut milk", normalizedName:"coconut milk", category:"Pantry", size:"200 ml", unit:"can", price:85, inStock:true, tags:["vegan","lactose-free"], substituteIds:["sofit-almond"] },
  { id:"brown-bread", name:"Brown bread", normalizedName:"brown bread", category:"Bakery", size:"400 g", unit:"packet", price:50, inStock:true, tags:["whole-wheat","healthy"], substituteIds:["harvest-bread"] }
];

const categoryMap: Record<string, Category> = { milk:"Dairy", egg:"Dairy", bread:"Bakery", rice:"Grains", atta:"Grains", flour:"Grains", besan:"Grains", bajra:"Grains", sugar:"Pantry", salt:"Pantry", apple:"Produce", banana:"Produce", mango:"Produce", orange:"Produce", tomato:"Produce", onion:"Produce", spinach:"Produce", potato:"Produce", water:"Beverages", toothpaste:"Personal Care", chips:"Snacks", "cooking oil":"Pantry" };
export const categorize = (name: string): Category => catalog.find(p => p.normalizedName === name)?.category ?? categoryMap[name] ?? "Other";
