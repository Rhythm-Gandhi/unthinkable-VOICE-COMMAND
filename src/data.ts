import type { Category, Product } from "./types";

export const catalog: Product[] = [
  { id:"amul-taaza", name:"Milk", normalizedName:"milk", brand:"Amul", category:"Dairy", size:"1 L", unit:"litre", price:58, inStock:false, tags:["toned"], substituteIds:["mother-milk","sofit-almond"] },
  { id:"mother-milk", name:"Milk", normalizedName:"milk", brand:"Mother Dairy", category:"Dairy", size:"1 L", unit:"litre", price:56, inStock:true, tags:["toned"], substituteIds:["amul-taaza","sofit-almond"] },
  { id:"sofit-almond", name:"Almond milk", normalizedName:"almond milk", brand:"Sofit", category:"Dairy", size:"1 L", unit:"litre", price:295, inStock:true, tags:["vegan","lactose-free"], substituteIds:["mother-milk"] },
  { id:"farm-eggs", name:"Eggs", normalizedName:"egg", brand:"Farm Fresh", category:"Dairy", size:"6 pieces", unit:"piece", price:72, inStock:true, tags:["protein"] },
  { id:"brit-bread", name:"Bread", normalizedName:"bread", brand:"Britannia", category:"Bakery", size:"400 g", unit:"packet", price:45, inStock:true, tags:["white"], substituteIds:["harvest-bread"] },
  { id:"harvest-bread", name:"Bread", normalizedName:"bread", brand:"Harvest Gold", category:"Bakery", size:"450 g", unit:"packet", price:55, inStock:true, tags:["whole-wheat"], substituteIds:["brit-bread"] },
  { id:"tata-salt", name:"Salt", normalizedName:"salt", brand:"Tata", category:"Pantry", size:"1 kg", unit:"packet", price:28, inStock:true, tags:["iodized"] },
  { id:"madhur-sugar", name:"Sugar", normalizedName:"sugar", brand:"Madhur", category:"Pantry", size:"1 kg", unit:"packet", price:54, inStock:true, tags:[] },
  { id:"tata-sugar", name:"Sugar", normalizedName:"sugar", brand:"Tata", category:"Pantry", size:"1 kg", unit:"packet", price:62, inStock:true, tags:[] },
  { id:"aashirvaad-atta", name:"Atta", normalizedName:"atta", brand:"Aashirvaad", category:"Pantry", size:"5 kg", unit:"packet", price:285, inStock:true, tags:["whole-wheat"] },
  { id:"fresh-besan", name:"Besan", normalizedName:"besan", brand:"Fresh Mills", category:"Grains", size:"1 kg", unit:"kilogram", price:95, inStock:true, tags:["gram-flour","protein","gluten-free"] },
  { id:"india-rice", name:"Basmati rice", normalizedName:"rice", brand:"India Gate", category:"Pantry", size:"5 kg", unit:"packet", price:640, inStock:true, tags:["basmati"] },
  { id:"fortune-oil", name:"Cooking oil", normalizedName:"cooking oil", brand:"Fortune", category:"Pantry", size:"1 L", unit:"bottle", price:148, inStock:true, tags:["sunflower"], onSale:true, originalPrice:170 },
  { id:"colgate", name:"Toothpaste", normalizedName:"toothpaste", brand:"Colgate", category:"Personal Care", size:"150 g", unit:"piece", price:145, inStock:true, tags:["fresh"] },
  { id:"dabur", name:"Toothpaste", normalizedName:"toothpaste", brand:"Dabur Red", category:"Personal Care", size:"200 g", unit:"piece", price:118, inStock:true, tags:["herbal"], onSale:true, originalPrice:135 },
  { id:"sensodyne", name:"Toothpaste", normalizedName:"toothpaste", brand:"Sensodyne", category:"Personal Care", size:"100 g", unit:"piece", price:210, inStock:true, tags:["sensitive"] },
  { id:"apple", name:"Apples", normalizedName:"apple", brand:"Fresh", category:"Produce", size:"1 kg", unit:"kilogram", price:180, inStock:true, tags:["fruit","organic"], seasonalMonths:[7,8,9,10] },
  { id:"banana", name:"Bananas", normalizedName:"banana", brand:"Fresh", category:"Produce", size:"6 pieces", unit:"piece", price:55, inStock:true, tags:["fruit"], seasonalMonths:[1,2,3,4,5,6,7,8,9,10,11,12] },
  { id:"mango", name:"Mangoes", normalizedName:"mango", brand:"Fresh", category:"Produce", size:"1 kg", unit:"kilogram", price:160, inStock:true, tags:["fruit"], seasonalMonths:[4,5,6,7] },
  { id:"tomato", name:"Tomatoes", normalizedName:"tomato", brand:"Fresh", category:"Produce", size:"1 kg", unit:"kilogram", price:48, inStock:true, tags:["vegetable"] },
  { id:"water", name:"Water", normalizedName:"water", brand:"Bisleri", category:"Beverages", size:"1 L", unit:"bottle", price:20, inStock:true, tags:[] },
  { id:"chips", name:"Potato chips", normalizedName:"chips", brand:"Lay's", category:"Snacks", size:"90 g", unit:"packet", price:50, inStock:true, tags:["snack"] },
  { id:"dishwash", name:"Dishwash liquid", normalizedName:"dishwash liquid", brand:"Vim", category:"Household", size:"500 ml", unit:"bottle", price:115, inStock:true, tags:["cleaning"] }
  ,{ id:"onion", name:"Onions", normalizedName:"onion", brand:"Fresh", category:"Produce", size:"1 kg", unit:"kilogram", price:40, inStock:true, tags:["vegetable","healthy"] }
  ,{ id:"spinach", name:"Spinach", normalizedName:"spinach", brand:"Fresh", category:"Produce", size:"1 bunch", unit:"bunch", price:30, inStock:true, tags:["vegetable","healthy","iron"] }
  ,{ id:"potato", name:"Potatoes", normalizedName:"potato", brand:"Fresh", category:"Produce", size:"1 kg", unit:"kilogram", price:35, inStock:true, tags:["vegetable"] }
  ,{ id:"bajra", name:"Bajra", normalizedName:"bajra", brand:"Fresh Mills", category:"Grains", size:"1 kg", unit:"kilogram", price:65, inStock:true, tags:["whole-grain","gluten-free"] }
  ,{ id:"amul-butter", name:"Butter", normalizedName:"butter", brand:"Amul", category:"Dairy", size:"500 g", unit:"packet", price:285, inStock:true, tags:["dairy"], substituteIds:["nutralite","peanut-butter"] }
  ,{ id:"nutralite", name:"Table spread", normalizedName:"table spread", brand:"Nutralite", category:"Dairy", size:"500 g", unit:"packet", price:210, inStock:true, tags:["lower-cost"], substituteIds:["amul-butter"] }
  ,{ id:"peanut-butter", name:"Peanut butter", normalizedName:"peanut butter", brand:"Pintola", category:"Pantry", size:"350 g", unit:"jar", price:199, inStock:true, tags:["high-protein","vegan"], substituteIds:["amul-butter"] }
  ,{ id:"olive-oil", name:"Olive oil", normalizedName:"olive oil", brand:"Figaro", category:"Pantry", size:"1 L", unit:"bottle", price:799, inStock:true, tags:["healthy"] }
  ,{ id:"ice-cream", name:"Ice cream", normalizedName:"ice cream", brand:"Amul", category:"Frozen", size:"750 ml", unit:"tub", price:240, inStock:true, tags:["dessert"] }
  ,{ id:"green-tea", name:"Green tea", normalizedName:"green tea", brand:"Tetley", category:"Beverages", size:"25 bags", unit:"box", price:165, inStock:true, tags:["healthy","sugar-free"] }
  ,{ id:"coconut-milk", name:"Coconut milk", normalizedName:"coconut milk", brand:"Dabur Hommade", category:"Pantry", size:"200 ml", unit:"can", price:85, inStock:true, tags:["vegan","lactose-free"], substituteIds:["sofit-almond"] }
  ,{ id:"brown-bread", name:"Brown bread", normalizedName:"brown bread", brand:"English Oven", category:"Bakery", size:"400 g", unit:"packet", price:50, inStock:true, tags:["whole-wheat","healthy"], substituteIds:["harvest-bread"] }
];

const categoryMap: Record<string, Category> = { milk:"Dairy", egg:"Dairy", bread:"Bakery", rice:"Grains", atta:"Grains", flour:"Grains", besan:"Grains", bajra:"Grains", sugar:"Pantry", salt:"Pantry", apple:"Produce", banana:"Produce", mango:"Produce", orange:"Produce", tomato:"Produce", onion:"Produce", spinach:"Produce", potato:"Produce", water:"Beverages", toothpaste:"Personal Care", chips:"Snacks", "cooking oil":"Pantry" };
export const categorize = (name: string): Category => catalog.find(p => p.normalizedName === name)?.category ?? categoryMap[name] ?? "Other";
