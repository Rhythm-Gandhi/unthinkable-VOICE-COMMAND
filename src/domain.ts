import { catalog, categorize } from "./data";
import type { AppData, ParsedCommand, ParsedItem, Product, ShoppingItem, Source, Suggestion } from "./types";

const aliases: Record<string,string> = {
  milk:"milk",doodh:"milk",dudh:"milk","दूध":"milk","দুধ":"milk","દૂધ":"milk","ਦੁੱਧ":"milk","பால்":"milk","పాలు":"milk","ಹಾಲು":"milk","പാൽ":"milk","دودھ":"milk",
  atta:"atta",aata:"atta",ata:"atta","आटा":"atta","আটা":"atta","પીંઠ":"atta","ਆਟਾ":"atta","மாவு":"atta","పిండి":"atta","ಹಿಟ್ಟು":"atta","മാവ്":"atta","آٹا":"atta",
  sugar:"sugar",shakkar:"sugar",cheeni:"sugar","चीनी":"sugar","शक्कर":"sugar","চিনি":"sugar","સાકર":"sugar","ਖੰਡ":"sugar","சர்க்கரை":"sugar","చక్కెర":"sugar","ಸಕ್ಕರೆ":"sugar","പഞ്ചസാര":"sugar","چینی":"sugar",
  onion:"onion",onions:"onion",pyaaz:"onion",pyaz:"onion","प्याज":"onion","प्याज़":"onion","পেঁয়াজ":"onion","ડુંગળી":"onion","ਪਿਆਜ਼":"onion","வெங்காயம்":"onion","ఉల్లిపాయ":"onion","ಈರುಳ್ಳಿ":"onion","ഉള്ളി":"onion","پیاز":"onion",
  tomato:"tomato",tomatoes:"tomato","टमाटर":"tomato","টমেটো":"tomato","ટામેટા":"tomato","ਟਮਾਟਰ":"tomato","தக்காளி":"tomato","టమాటా":"tomato","ಟೊಮೆಟೊ":"tomato","തക്കാളി":"tomato","ٹماٹر":"tomato",
  potato:"potato",potatoes:"potato","आलू":"potato","আলু":"potato","બટાકા":"potato","ਆਲੂ":"potato","உருளைக்கிழங்கு":"potato","బంగాళాదుంప":"potato","ಆಲೂಗಡ್ಡೆ":"potato","ഉരുളക്കിഴങ്ങ്":"potato","آلو":"potato",
  apple:"apple",apples:"apple","सेब":"apple","আপেল":"apple","સફરજન":"apple","ਸੇਬ":"apple","ஆப்பிள்":"apple","ఆపిల్":"apple","ಸೇಬು":"apple","ആപ്പിൾ":"apple","سیب":"apple",
  banana:"banana",bananas:"banana","केला":"banana","কলা":"banana","કેળું":"banana","ਕੇਲਾ":"banana","வாழைப்பழம்":"banana","అరటి":"banana","ಬಾಳೆಹಣ್ಣು":"banana","വാഴപ്പഴം":"banana","کیلا":"banana",
  egg:"egg",eggs:"egg",anda:"egg",ande:"egg","अंडा":"egg","ডিম":"egg","ઇંડા":"egg","ਅੰਡਾ":"egg","முட்டை":"egg","గుడ్డు":"egg","ಮೊಟ್ಟೆ":"egg","മുട്ട":"egg","انڈا":"egg",
  bread:"bread","ब्रेड":"bread","রুটি":"bread","બ્રેડ":"bread","ਬਰੈੱਡ":"bread","ரொட்டி":"bread","బ్రెడ్":"bread","ಬ್ರೆಡ್":"bread","ബ്രെഡ്":"bread","روٹی":"bread",
  rice:"rice","चावल":"rice","চাল":"rice","ચોખા":"rice","ਚੌਲ":"rice","அரிசி":"rice","బియ్యం":"rice","ಅಕ್ಕಿ":"rice","അരി":"rice","چاول":"rice",
  besan:"besan",basen:"besan",basin:"besan",besen:"besan","beसन":"besan","बेसन":"besan","বেসন":"besan","ચણાનો લોટ":"besan","ਚਨੇ ਦਾ ਆਟਾ":"besan","கடலை மாவு":"besan","శనగపిండి":"besan","ಕಡಲೆ ಹಿಟ್ಟು":"besan","കടലമാവ്":"besan","بیسن":"besan","gram flour":"besan","chickpea flour":"besan",
  bajra:"bajra","बाजरा":"bajra",water:"water","पानी":"water",paani:"water",salt:"salt",namak:"salt","नमक":"salt",spinach:"spinach",palak:"spinach","पालक":"spinach",mango:"mango",mangoes:"mango",chips:"chips",toothpaste:"toothpaste"
};

const numbers: Record<string,number> = {
  zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,twelve:12,half:.5,
  ek:1,do:2,teen:3,char:4,paanch:5,das:10,aadha:.5,adha:.5,dedh:1.5,
  "एक":1,"दो":2,"तीन":3,"चार":4,"पांच":5,"आधा":.5,"डेढ़":1.5,
  "এক":1,"দুই":2,"তিন":3,"দেড়":1.5,"અડધો":.5,"એક":1,"બે":2,"ત્રણ":3,
  "ਇੱਕ":1,"ਦੋ":2,"ਤਿੰਨ":3,"ஒன்று":1,"இரண்டு":2,"மூன்று":3,"அரை":.5,
  "ఒక":1,"రెండు":2,"మూడు":3,"ಅರ್ಧ":.5,"ಒಂದು":1,"ಎರಡು":2,"ಮೂರು":3,
  "അര":.5,"ഒന്ന്":1,"രണ്ട്":2,"മൂന്ന്":3,"ایک":1,"دو":2,"تین":3,"آدھا":.5
};

const units: Record<string,string> = {
  kg:"kg",kgs:"kg",kilogram:"kg",kilograms:"kg",kilo:"kg",kilos:"kg",k:"kg","किलो":"kg","কিলো":"kg","કિલો":"kg","ਕਿਲੋ":"kg","கிலோ":"kg","కిలో":"kg","ಕಿಲೋ":"kg","കിലോ":"kg","کلو":"kg",
  g:"g",gm:"g",gram:"g",grams:"g","ग्राम":"g",l:"l",litre:"l",litres:"l",liter:"l",liters:"l","लीटर":"l",
  packet:"packet",packets:"packet",pack:"packet",packs:"packet","पैकेट":"packet","প্যাকেট":"packet","પેકેટ":"packet","ਪੈਕੇਟ":"packet","பாக்கெட்":"packet","ప్యాకెట్":"packet","ಪ್ಯಾಕೆಟ್":"packet","പാക്കറ്റ്":"packet","پیکٹ":"packet",
  piece:"piece",pieces:"piece",bottle:"bottle",bottles:"bottle",box:"box",boxes:"box",can:"can",cans:"can",dozen:"dozen",dozens:"dozen",jar:"jar",jars:"jar",bunch:"bunch",bunches:"bunch"
};

const languageScripts: [RegExp,string][] = [[/[\u0900-\u097f]/,"hi"],[/[\u0980-\u09ff]/,"bn"],[/[\u0a80-\u0aff]/,"gu"],[/[\u0a00-\u0a7f]/,"pa"],[/[\u0b80-\u0bff]/,"ta"],[/[\u0c00-\u0c7f]/,"te"],[/[\u0c80-\u0cff]/,"kn"],[/[\u0d00-\u0d7f]/,"ml"],[/[\u0600-\u06ff]/,"ur"]];
const esc=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
const tidy=(s:string)=>s.replace(/\s+/g," ").trim();

export function detectLanguage(text:string){if(/[\u0900-\u097f]/.test(text)&&/(?:पाहिजे|माझी|सांगा|कमी करा|सुचवा)/.test(text))return"mr";return languageScripts.find(([r])=>r.test(text))?.[1]??(/\b(?:chahiye|karo|hatao|dikhao|kitna|meri|batao)\b/i.test(text)?"hinglish":"en")}

export function normalizeTranscript(raw:string){
  let text=raw.normalize("NFKC").toLowerCase().replace(/[’']/g,"").replace(/\b(hata|kar)\s+do\b/g,"$1").replace(/(हटा|कर)\s+दो/g,"$1").replace(/([0-9])\s*k\b/g,"$1 kg").replace(/\bone\s+and\s+(?:a\s+)?half\b/g,"1.5").replace(/\b(?:aadha|adha)\b/g,"0.5").replace(/\bdedh\b/g,"1.5").replace(/[^\p{L}\p{M}\p{N}.]+/gu," ").replace(/\.(?!\d)/g," ");
  for(const [word,value] of Object.entries(numbers)){const tail=word==="do"?"(?!\\s+(?:i|you|we|not|have)\\b)":"";text=text.replace(new RegExp(`(?<![\\p{L}\\p{N}])${esc(word)}(?![\\p{L}\\p{N}])${tail}`,"gu"),String(value))}
  for(const [word,value] of Object.entries(aliases).sort((a,b)=>b[0].length-a[0].length))text=text.replace(new RegExp(`(?<![\\p{L}\\p{N}])${esc(word)}(?![\\p{L}\\p{N}])`,"gu"),value);
  for(const [word,value] of Object.entries(units))text=text.replace(new RegExp(`(?<![\\p{L}\\p{N}])${esc(word)}(?![\\p{L}\\p{N}])`,"gu"),value);
  return tidy(text);
}

const singular=(s:string)=>s.endsWith("ies")?`${s.slice(0,-3)}y`:s.endsWith("oes")?s.slice(0,-2):s.endsWith("s")&&!s.endsWith("ss")?s.slice(0,-1):s;
export function normalizeItem(value:string){const clean=normalizeTranscript(value).replace(/[^\p{L}\p{N} ]/gu," ");return aliases[clean]??singular(tidy(clean))}

const productNames=[...new Set([...catalog.map(p=>p.normalizedName),...Object.values(aliases)])].sort((a,b)=>b.length-a.length);
function itemOccurrences(text:string){
  const found:{name:string;start:number;end:number}[]=[];
  for(const name of productNames){for(const m of text.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])${esc(name)}(?![\\p{L}\\p{N}])`,"gu"))){const start=m.index!,end=start+name.length;if(!found.some(x=>start<x.end&&end>x.start))found.push({name,start,end})}}
  return found.sort((a,b)=>a.start-b.start);
}

function closestMeasurement(text:string,start:number,end:number){
  const tokens=[...text.matchAll(/\S+/g)].map(m=>({word:m[0],start:m.index!,end:m.index!+m[0].length}));
  const itemIndex=tokens.findIndex(t=>t.start>=start&&t.start<end);
  const nearby=tokens.map((t,i)=>({t,i,d:i<itemIndex?itemIndex-i:i-itemIndex})).filter(x=>x.d<=5);
  const qty=nearby.filter(x=>/^\d+(?:\.\d+)?$/.test(x.t.word)).sort((a,b)=>a.d-b.d)[0];
  const unitCandidates=nearby.filter(x=>Object.values(units).includes(x.t.word)).sort((a,b)=>qty?Math.abs(a.i-qty.i)-Math.abs(b.i-qty.i):a.d-b.d);
  return {quantity:qty?Number(qty.t.word):1,unit:unitCandidates[0]?.t.word??"",explicitQuantity:!!qty};
}

export function parseItems(raw:string):ParsedItem[]{
  const text=normalizeTranscript(raw),occ=itemOccurrences(text);
  return occ.map(({name,start,end})=>{const m=closestMeasurement(text,start,end),matches=catalog.filter(p=>p.normalizedName===name);return{item:matches[0]?.name??name,normalizedItem:name,productId:matches.length===1?matches[0].id:undefined,...m}});
}

const has=(text:string,patterns:string[])=>patterns.some(x=>text.includes(x));
const intents=new Set(["ADD_ITEM","REMOVE_QUANTITY","REMOVE_ALL","SET_QUANTITY","QUERY_QUANTITY","QUERY_LIST","SEARCH_PRODUCT","CLEAR_LIST","SHOW_SUBSTITUTES","CHOOSE_PRODUCT","RECOMMEND_PRODUCTS","CART_TOTAL","PRICE_QUERY","NAVIGATE","UNDO","SHARE_LIST","UNKNOWN"]);
export function isParsedCommand(value:unknown):value is ParsedCommand{if(!value||typeof value!=="object")return false;const p=value as Partial<ParsedCommand>;if(!p.intent||!intents.has(p.intent)||typeof p.rawTranscript!=="string"||typeof p.confidence!=="number"||!Number.isFinite(p.confidence)||p.confidence<0||p.confidence>1)return false;if(p.quantity!==undefined&&(!Number.isFinite(p.quantity)||p.quantity<0))return false;return true}
const listPhrases=["what is on my list","what have i added","entire list","whole shopping list","show full list","continue list","read my cart","shopping list batao","meri list","मेरी पूरी लिस्ट","मेरी पूरी सूची","আমার তালিকা","મારી યાદી","ਮੇਰੀ ਸੂਚੀ","என் பட்டியல்","నా జాబితా","ನನ್ನ ಪಟ್ಟಿ","എന്റെ പട്ടിക","میری فہرست"];
const recommendPhrases=["recommend","suggest","something to eat","what should i eat","what should i have","im hungry","i am hungry","idea for breakfast","have with tea","something healthy","something healthier","anything cheap","anything without","cheaper options","dont like that","kuch khane ko batao","aaj kya khaun","aaj kya khau","खाने को बताओ","क्या खाऊं","क्या खाऊ","ক্ষুধার্ত","কি খাব","ભૂખ લાગી","શું ખાઉં","ਭੁੱਖ ਲੱਗੀ","ਕੀ ਖਾਵਾਂ","பசிக்கிறது","என்ன சாப்பிட","ఆకలిగా","ఏమి తినాలి","ಹಸಿವಾಗಿದೆ","ಏನು ತಿನ್ನಲಿ","വിശക്കുന്നു","എന്ത് കഴിക്കാം","بھوک لگی","کیا کھاؤں","healthy snack","breakfast","seasonal","बताओ","सुझा","सुच","পরামর্শ","સૂચવો","ਸੁਝਾਓ","பரிந்துரை","సూచించు","ಸೂಚಿಸಿ","നിർദ്ദേശിക്കുക","تجویز"];
const removePhrases=["remove","take out","reduce","decrease","dont need","do not need","dont want","no longer need","nahi chahiye","नहीं चाहिए","kam kar","hata","हटा","कम कर","সরাও","કાઢ","ਹਟਾ","நீக்கு","తొలగించ","ತೆಗೆ","നീക്ക","ہٹا"];
const setPhrases=["make ","only need","set ","change ","kar do","कर दो"];
const addPhrases=["add","need","get me","put ","buy","want","chahiye","le lena","जोड़","चाहिए","দরকার","চাই","જોઈએ","ਚਾਹੀਦਾ","வேண்டும்","కావాలి","ಬೇಕು","വേണം","چاہیے"];
const queryWords=["how much","how many","quantity","kitna","kitni","कितना","কত","કેટલું","ਕਿੰਨਾ","எவ்வளவு","ఎంత","ಎಷ್ಟು","എത്ര","کتنا"];

function unknownItem(text:string){
  const stripped=tidy(text.replace(/\b(?:please|can you|could you|umm|uh|you know|some|of|the|my|basket|cart|list|add|buy|need|want|get me|put|karo|kar do|chahiye|le lena|remove|find|show)\b/g," ").replace(/\b\d+(?:\.\d+)?\b/g," ").replace(new RegExp(`\\b(?:${[...new Set(Object.values(units))].join("|")})\\b`,"g")," "));
  return stripped&&stripped.length<40?stripped:undefined;
}

export function parseCommand(rawTranscript:string):ParsedCommand{
  const text=normalizeTranscript(rawTranscript),language=detectLanguage(rawTranscript),items=parseItems(text),first=items[0];
  const base={rawTranscript,normalizedTranscript:text,language,confidence:first?.normalizedItem?.length?0.93:0.45};
  if(has(text,["undo","wapas","वापस"]))return{intent:"UNDO",...base,confidence:.98};
  if(has(text,["share list","share my list"]))return{intent:"SHARE_LIST",...base,confidence:.98};
  if(has(text,["clear list","empty cart"]))return{intent:"CLEAR_LIST",...base,confidence:.96};
  const choice=text.match(/(?:add|choose|select)\s+(?:the\s+)?(first|second|third)(?:\s+one)?\b/);if(choice){const indices:Record<string,number>={first:0,second:1,third:2};return{intent:"CHOOSE_PRODUCT",...base,selectionIndex:indices[choice[1]],confidence:.96}}
  if(has(text,listPhrases)||(/(?:list|सूची|लिस्ट|তালিকা|યાદી|ਸੂਚੀ|பட்டியல்|జాబితా|ಪಟ್ಟಿ|പട്ടിക|فہرست)/u.test(text)&&has(text,["what","tell","read","bata","बता","কি","શું","என்ன","ఏమి","ಏನು","എന്ത്","کیا"])))return{intent:"QUERY_LIST",...base,confidence:.96};
  if(has(text,["alternative","instead of","substitute","cheaper option","विकल्प","বিকল্প","વિકલ્પ","மாற்று","ప్రత్యామ్నాయం","بدل"])&&!(!first&&text.includes("cheaper option")))return{intent:"SHOW_SUBSTITUTES",...base,...first,confidence:first?.normalizedItem?.length?.9:.72};
  if(has(text,recommendPhrases))return{intent:"RECOMMEND_PRODUCTS",...base,items,...first,maxPrice:priceLimit(text),attributes:recommendAttributes(text),confidence:.94};
  if(!first&&priceLimit(text)!==undefined)return{intent:"RECOMMEND_PRODUCTS",...base,maxPrice:priceLimit(text),attributes:recommendAttributes(text),confidence:.86};
  if(has(text,["total","estimated total","कुल","মোট","કુલ","மொத்தம்","మొత్తం","ಒಟ್ಟು","ആകെ","کل قیمت"]))return{intent:"CART_TOTAL",...base,confidence:.94};
  if(first&&has(text,removePhrases)){const all=has(text,["anymore","no longer","अब नहीं","पूरा","all"]),reduceOnly=has(text,["reduce","decrease","kam kar","कम कर"]);return{intent:first.explicitQuantity&&!all||reduceOnly&&!first.explicitQuantity?"REMOVE_QUANTITY":"REMOVE_ALL",...base,...first,quantity:first.explicitQuantity?first.quantity:undefined,quantityExplicit:first.explicitQuantity,needsConfirmation:!first.explicitQuantity&&!reduceOnly,confidence:.94}}
  if(first&&(has(text,setPhrases)||/\bkar\b|\bकर\b/u.test(text))&&first.explicitQuantity)return{intent:"SET_QUANTITY",...base,...first,quantity:first.quantity,quantityExplicit:true,confidence:.93};
  if(first&&/\bquality\b/.test(text)&&has(text,["what","how","tell","check"]))return{intent:"QUERY_QUANTITY",...base,...first,quantity:first.quantity,quantityExplicit:false,confidence:.72,needsConfirmation:true};
  if(first&&has(text,queryWords))return{intent:"QUERY_QUANTITY",...base,...first,quantity:first.quantity,quantityExplicit:first.explicitQuantity,confidence:.96};
  const maxPrice=priceLimit(text);
  if(has(text,["find","search","show","dikhao","दिखाओ","খুঁজে","தேடு","చూపించు","ಹುಡುಕು","കാണിക്കുക","دکھاؤ"]))return{intent:"SEARCH_PRODUCT",...base,...first,maxPrice,confidence:first?.normalizedItem?.length?.91:.55};
  if(first&&(has(text,addPhrases)||/^\d+(?:\.\d+)?\s+(?:kg|g|l|packet|piece|bottle|box|can|dozen)\b/.test(text)))return{intent:"ADD_ITEM",...base,...first,items,quantity:first.quantity,quantityExplicit:first.explicitQuantity,confidence:.92};
  const fallback=unknownItem(text);if(fallback&&has(text,addPhrases)){const normalizedItem=normalizeItem(fallback);return{intent:"ADD_ITEM",...base,item:fallback,normalizedItem,quantity:1,unit:"",items:[{item:fallback,normalizedItem,quantity:1,unit:"",explicitQuantity:false}],confidence:normalizedItem.length>2?.7:.45}}
  return{intent:"UNKNOWN",...base};
}

function priceLimit(text:string){const m=text.match(/(?:under|below|within|andar|अंदर|से कम)\s*(?:₹|rs\.?|rupees?|rupaye)?\s*(\d+)|(?:₹|rs\.?|rupees?|rupaye)\s*(\d+)\s*(?:ke andar|or less)?|(\d+)\s*(?:₹|rs\.?|rupees?|rupaye)\s*(?:ke andar|or less)/);return m?Number(m[1]??m[2]??m[3]):undefined}
function recommendAttributes(text:string){const attributes=["fruit","healthy","snack","breakfast","vegan","protein","seasonal","cheap"].filter(x=>text.includes(x)||x==="healthy"&&text.includes("healthier"));if(has(text,["eat","hungry","breakfast","with tea","healthy","cheap","khane","khaun","khau","खाने","खाऊ","খাব","ભૂખ","ਖਾਵਾਂ","சாப்பிட","తినాలి","ತಿನ್ನಲಿ","കഴിക്കാം","کھاؤں"]))attributes.push("food");const without=text.match(/(?:without|no)\s+([\p{L}\p{M}]+)/u);if(without)attributes.push(`without:${normalizeItem(without[1])}`);return attributes}

export const formatMoney=(paise:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(paise/100);
export const itemSubtotalPaise=(item:ShoppingItem)=>Math.round((item.estimatedUnitPricePaise??Math.round((item.estimatedUnitPrice??0)*100))*item.quantity);
function productUnitPrice(product:Product|undefined,requestedUnit:string){if(!product)return;const size=product.size.match(/([\d.]+)\s*(kg|g|l|litre|liter)\b/i),divisor=size&&canonicalUnit(size[2])===requestedUnit?Number(size[1]):1;return{price:product.price/divisor,original:product.originalPrice?product.originalPrice/divisor:undefined}}

export function makeItem(name:string,quantity=1,unit="",source:Source="text",product?:Product):ShoppingItem{
  const normalizedName=product?.normalizedName??normalizeItem(name),match=product??catalog.find(p=>p.normalizedName===normalizedName&&p.inStock),now=new Date().toISOString(),requestedUnit=canonicalUnit(unit||match?.unit||"piece"),prices=productUnitPrice(match,requestedUnit);
  return{id:crypto.randomUUID(),productId:product?.id,name:product?.name??(match?.name??name.replace(/\b\w/g,c=>c.toUpperCase())),normalizedName,category:match?.category??categorize(normalizedName),quantity,unit:requestedUnit,size:product?.size,estimatedUnitPricePaise:Math.round((prices?.price??50)*100),originalUnitPricePaise:prices?.original?Math.round(prices.original*100):undefined,approximatePrice:!match,purchased:false,source,createdAt:now,updatedAt:now};
}
const canonicalUnit=(unit:string)=>units[unit.toLowerCase()]??unit.toLowerCase();
export function mergeItem(list:ShoppingItem[],item:ShoppingItem){const found=list.find(x=>(item.productId&&x.productId===item.productId||x.normalizedName===item.normalizedName)&&canonicalUnit(x.unit)===canonicalUnit(item.unit));return found?list.map(x=>x.id===found.id?{...x,quantity:x.quantity+item.quantity,updatedAt:new Date().toISOString()}:x):[...list,item]}

export function findCartItem(list:ShoppingItem[],command:Pick<ParsedCommand,"productId"|"normalizedItem">){return list.find(x=>command.productId&&x.productId===command.productId)||list.find(x=>x.normalizedName===command.normalizedItem)}
export function applyCartCommand(list:ShoppingItem[],command:ParsedCommand):{list:ShoppingItem[];message:string;changed:boolean;needsConfirmation?:boolean}{
  if(command.intent==="QUERY_LIST"){if(!list.length)return{list,message:localizedResponse(command.language,"empty"),changed:false};const total=list.reduce((n,x)=>n+itemSubtotalPaise(x),0),savings=list.reduce((n,x)=>n+Math.max(0,((x.originalUnitPricePaise??x.estimatedUnitPricePaise??0)-(x.estimatedUnitPricePaise??0))*x.quantity),0),message=localizedResponse(command.language,"list",{count:list.length,items:list.map(x=>`${x.quantity} ${pluralUnit(x.unit,x.quantity)} ${x.name}`).join(", "),total:formatMoney(total)});return{list,message:savings?`${message} Savings ${formatMoney(savings)}.`:message,changed:false}}
  const found=findCartItem(list,command);if(!found)return{list,message:`${command.item??"That product"} isn’t on your list.`,changed:false};
  if(command.intent==="QUERY_QUANTITY")return{list,message:localizedResponse(command.language,"quantity",{quantity:found.quantity,unit:pluralUnit(found.unit,found.quantity),name:found.name,price:formatMoney(found.estimatedUnitPricePaise??0),baseUnit:canonicalUnit(found.unit),subtotal:formatMoney(itemSubtotalPaise(found))}),changed:false};
  if(command.unit&&found.unit&&canonicalUnit(command.unit)!==canonicalUnit(found.unit))return{list,message:`Your ${found.name} is stored in ${pluralUnit(found.unit,found.quantity)}, not ${command.unit}. Please clarify the unit before changing it.`,changed:false,needsConfirmation:command.confidence<1||undefined};
  if(command.intent==="REMOVE_ALL"&&command.confidence<1)return{list,message:`Remove all ${found.quantity} ${pluralUnit(found.unit,found.quantity)} of ${found.name}?`,changed:false,needsConfirmation:true};
  if(command.intent==="REMOVE_QUANTITY"&&!command.quantityExplicit)return{list,message:`How much ${found.name} should I remove?`,changed:false};
  const q=command.quantity??1;
  if(command.intent==="REMOVE_QUANTITY"){
    if(q>found.quantity&&command.confidence<1)return{list,message:`You have only ${found.quantity} ${pluralUnit(found.unit,found.quantity)} of ${found.name}. Remove the remaining amount?`,changed:false,needsConfirmation:true};
    const remaining=Math.max(0,found.quantity-q),next=remaining?list.map(x=>x.id===found.id?{...x,quantity:remaining,updatedAt:new Date().toISOString()}:x):list.filter(x=>x.id!==found.id);
    const removed=Math.min(q,found.quantity),message=`${localizedResponse(command.language,"removed",{quantity:removed,unit:pluralUnit(found.unit,removed),name:found.name})} ${remaining?localizedResponse(command.language,"remaining",{quantity:remaining,unit:pluralUnit(found.unit,remaining)}):localizedResponse(command.language,"none")}`;return{list:next,message,changed:true};
  }
  if(command.intent==="SET_QUANTITY"){if(q<0)return{list,message:"Tell me a valid quantity.",changed:false};const next=q===0?list.filter(x=>x.id!==found.id):list.map(x=>x.id===found.id?{...x,quantity:q,updatedAt:new Date().toISOString()}:x);return{list:next,message:`Set ${found.name} to ${q} ${pluralUnit(found.unit,q)}.`,changed:true}}
  if(command.intent==="REMOVE_ALL")return{list:list.filter(x=>x.id!==found.id),message:`Removed all ${found.name} from your list.`,changed:true};
  return{list,message:"That command did not change your list.",changed:false};
}
const pluralUnit=(unit:string,q:number)=>{const u=canonicalUnit(unit);if(q===1||u==="kg"||u==="g"||u==="l")return u;return `${u}s`}

type ResponseKey="added"|"removed"|"remaining"|"none"|"quantity"|"list"|"empty"|"recommend";
const responseTemplates:Record<string,Record<ResponseKey,string>>={
  en:{added:"Added {quantity} {unit} of {name}.",removed:"Removed {quantity} {unit} of {name}.",remaining:"{quantity} {unit} remain.",none:"None remain.",quantity:"You have {quantity} {unit} of {name}, estimated at {price} per {baseUnit}, with an estimated subtotal of {subtotal}.",list:"Your shopping list contains {count} products: {items}. Estimated total {total}.",empty:"Your shopping list is empty.",recommend:"Here are {count} relevant recommendations. Nothing was added to your list."},
  hinglish:{added:"{name} ke {quantity} {unit} add kiye.",removed:"{name} ke {quantity} {unit} hata diye.",remaining:"{quantity} {unit} baaki hain.",none:"Kuch baaki nahi hai.",quantity:"Aapke paas {name} ke {quantity} {unit} hain; estimated subtotal {subtotal} hai.",list:"Aapki list mein {count} products hain: {items}. Estimated total {total} hai.",empty:"Aapki shopping list khaali hai.",recommend:"{count} useful recommendations mili hain. List mein kuch add nahi hua."},
  hi:{added:"{name} के {quantity} {unit} जोड़े गए।",removed:"{name} के {quantity} {unit} हटाए गए।",remaining:"{quantity} {unit} बाकी हैं।",none:"कुछ बाकी नहीं है।",quantity:"आपके पास {name} के {quantity} {unit} हैं; अनुमानित उप-योग {subtotal} है।",list:"आपकी सूची में {count} उत्पाद हैं: {items}। अनुमानित कुल {total} है।",empty:"आपकी खरीदारी सूची खाली है।",recommend:"{count} उपयोगी सुझाव मिले। सूची में कुछ नहीं जोड़ा गया।"},
  bn:{added:"{name} {quantity} {unit} যোগ করা হয়েছে।",removed:"{name} {quantity} {unit} সরানো হয়েছে।",remaining:"{quantity} {unit} বাকি আছে।",none:"কিছু বাকি নেই।",quantity:"আপনার কাছে {name} {quantity} {unit} আছে; আনুমানিক উপমোট {subtotal}।",list:"আপনার তালিকায় {count}টি পণ্য আছে: {items}। আনুমানিক মোট {total}।",empty:"আপনার কেনাকাটার তালিকা খালি।",recommend:"{count}টি প্রাসঙ্গিক পরামর্শ পাওয়া গেছে। কিছু যোগ করা হয়নি।"},
  mr:{added:"{name} चे {quantity} {unit} जोडले।",removed:"{name} चे {quantity} {unit} काढले।",remaining:"{quantity} {unit} बाकी आहेत।",none:"काहीही बाकी नाही।",quantity:"तुमच्याकडे {name} चे {quantity} {unit} आहेत; अंदाजे उपएकूण {subtotal} आहे।",list:"तुमच्या यादीत {count} उत्पादने आहेत: {items}. अंदाजे एकूण {total} आहे।",empty:"तुमची खरेदी यादी रिकामी आहे।",recommend:"{count} उपयुक्त शिफारसी मिळाल्या. यादीत काही जोडले नाही।"},
  gu:{added:"{name} ના {quantity} {unit} ઉમેર્યા।",removed:"{name} ના {quantity} {unit} કાઢ્યા।",remaining:"{quantity} {unit} બાકી છે।",none:"કંઈ બાકી નથી।",quantity:"તમારી પાસે {name} ના {quantity} {unit} છે; અંદાજિત પેટા-કુલ {subtotal} છે।",list:"તમારી યાદીમાં {count} વસ્તુઓ છે: {items}. અંદાજિત કુલ {total} છે।",empty:"તમારી ખરીદીની યાદી ખાલી છે।",recommend:"{count} ઉપયોગી સૂચનો મળ્યા. યાદીમાં કંઈ ઉમેરાયું નથી।"},
  pa:{added:"{name} ਦੇ {quantity} {unit} ਜੋੜੇ ਗਏ।",removed:"{name} ਦੇ {quantity} {unit} ਹਟਾਏ ਗਏ।",remaining:"{quantity} {unit} ਬਾਕੀ ਹਨ।",none:"ਕੁਝ ਬਾਕੀ ਨਹੀਂ।",quantity:"ਤੁਹਾਡੇ ਕੋਲ {name} ਦੇ {quantity} {unit} ਹਨ; ਅੰਦਾਜ਼ਨ ਉਪ-ਕੁੱਲ {subtotal} ਹੈ।",list:"ਤੁਹਾਡੀ ਸੂਚੀ ਵਿੱਚ {count} ਉਤਪਾਦ ਹਨ: {items}. ਅੰਦਾਜ਼ਨ ਕੁੱਲ {total} ਹੈ।",empty:"ਤੁਹਾਡੀ ਖਰੀਦਾਰੀ ਸੂਚੀ ਖਾਲੀ ਹੈ।",recommend:"{count} ਲਾਭਦਾਇਕ ਸੁਝਾਅ ਮਿਲੇ। ਕੁਝ ਵੀ ਜੋੜਿਆ ਨਹੀਂ ਗਿਆ।"},
  ta:{added:"{name} {quantity} {unit} சேர்க்கப்பட்டது.",removed:"{name} {quantity} {unit} நீக்கப்பட்டது.",remaining:"{quantity} {unit} மீதமுள்ளது.",none:"எதுவும் மீதமில்லை.",quantity:"உங்களிடம் {name} {quantity} {unit} உள்ளது; மதிப்பிடப்பட்ட துணை மொத்தம் {subtotal}.",list:"உங்கள் பட்டியலில் {count} பொருட்கள் உள்ளன: {items}. மதிப்பிடப்பட்ட மொத்தம் {total}.",empty:"உங்கள் வாங்கும் பட்டியல் காலியாக உள்ளது.",recommend:"{count} பயனுள்ள பரிந்துரைகள் கிடைத்தன. எதுவும் சேர்க்கப்படவில்லை."},
  te:{added:"{name} {quantity} {unit} జోడించబడింది.",removed:"{name} {quantity} {unit} తొలగించబడింది.",remaining:"{quantity} {unit} మిగిలి ఉన్నాయి.",none:"ఏమీ మిగలలేదు.",quantity:"మీ వద్ద {name} {quantity} {unit} ఉన్నాయి; అంచనా ఉపమొత్తం {subtotal}.",list:"మీ జాబితాలో {count} ఉత్పత్తులు ఉన్నాయి: {items}. అంచనా మొత్తం {total}.",empty:"మీ షాపింగ్ జాబితా ఖాళీగా ఉంది.",recommend:"{count} ఉపయోగకరమైన సూచనలు దొరికాయి. ఏదీ జోడించలేదు."},
  kn:{added:"{name} {quantity} {unit} ಸೇರಿಸಲಾಗಿದೆ.",removed:"{name} {quantity} {unit} ತೆಗೆದುಹಾಕಲಾಗಿದೆ.",remaining:"{quantity} {unit} ಉಳಿದಿವೆ.",none:"ಏನೂ ಉಳಿದಿಲ್ಲ.",quantity:"ನಿಮ್ಮ ಬಳಿ {name} {quantity} {unit} ಇದೆ; ಅಂದಾಜು ಉಪಮೊತ್ತ {subtotal}.",list:"ನಿಮ್ಮ ಪಟ್ಟಿಯಲ್ಲಿ {count} ಉತ್ಪನ್ನಗಳಿವೆ: {items}. ಅಂದಾಜು ಒಟ್ಟು {total}.",empty:"ನಿಮ್ಮ ಖರೀದಿ ಪಟ್ಟಿ ಖಾಲಿಯಾಗಿದೆ.",recommend:"{count} ಉಪಯುಕ್ತ ಸಲಹೆಗಳು ಸಿಕ್ಕಿವೆ. ಏನನ್ನೂ ಸೇರಿಸಲಾಗಿಲ್ಲ."},
  ml:{added:"{name} {quantity} {unit} ചേർത്തു.",removed:"{name} {quantity} {unit} നീക്കി.",remaining:"{quantity} {unit} ബാക്കിയുണ്ട്.",none:"ഒന്നും ബാക്കിയില്ല.",quantity:"നിങ്ങളുടെ പക്കൽ {name} {quantity} {unit} ഉണ്ട്; കണക്കാക്കിയ ഉപമൊത്തം {subtotal}.",list:"നിങ്ങളുടെ പട്ടികയിൽ {count} ഉൽപ്പന്നങ്ങളുണ്ട്: {items}. കണക്കാക്കിയ ആകെ {total}.",empty:"നിങ്ങളുടെ ഷോപ്പിംഗ് പട്ടിക ശൂന്യമാണ്.",recommend:"{count} പ്രയോജനകരമായ നിർദ്ദേശങ്ങൾ ലഭിച്ചു. ഒന്നും ചേർത്തിട്ടില്ല."},
  ur:{added:"{name} کے {quantity} {unit} شامل کیے گئے۔",removed:"{name} کے {quantity} {unit} ہٹا دیے گئے۔",remaining:"{quantity} {unit} باقی ہیں۔",none:"کچھ باقی نہیں۔",quantity:"آپ کے پاس {name} کے {quantity} {unit} ہیں؛ تخمینی ذیلی کل {subtotal} ہے۔",list:"آپ کی فہرست میں {count} مصنوعات ہیں: {items}۔ تخمینی کل {total} ہے۔",empty:"آپ کی خریداری کی فہرست خالی ہے۔",recommend:"{count} مفید تجاویز ملی ہیں۔ فہرست میں کچھ شامل نہیں ہوا۔"}
};
export function localizedResponse(language:string|undefined,key:ResponseKey,values:Record<string,string|number>={}){const template=(responseTemplates[language??"en"]??responseTemplates.en)[key];return template.replace(/\{(\w+)\}/g,(_,name)=>String(values[name]??""))}

export function searchProducts(command:ParsedCommand){let rows=catalog.filter(p=>p.inStock);if(command.normalizedItem)rows=rows.filter(p=>p.normalizedName===command.normalizedItem||p.name.toLowerCase().includes(command.normalizedItem!));if(command.maxPrice!==undefined)rows=rows.filter(p=>p.price<=command.maxPrice!);return rows.sort((a,b)=>a.price-b.price)}
export function recommendProducts(command:ParsedCommand,data?:AppData){let rows=catalog.filter(p=>p.inStock);const attrs=command.attributes??[],excluded=attrs.find(x=>x.startsWith("without:"))?.slice(8);if(attrs.includes("food"))rows=rows.filter(p=>["Dairy","Bakery","Snacks","Frozen"].includes(p.category)||p.tags.includes("fruit")||p.normalizedName==="peanut butter");if(excluded)rows=rows.filter(p=>p.normalizedName!==excluded&&!p.name.toLowerCase().includes(excluded));if(command.normalizedItem){const reference=catalog.find(p=>p.normalizedName===command.normalizedItem);rows=rows.filter(p=>p.normalizedName===command.normalizedItem||reference&&p.category===reference.category)}if(command.maxPrice!==undefined)rows=rows.filter(p=>p.price<=command.maxPrice!);if(attrs.includes("fruit"))rows=rows.filter(p=>p.tags.includes("fruit"));if(attrs.includes("healthy"))rows=rows.filter(p=>p.tags.some(t=>["healthy","fruit","protein","whole-wheat","gluten-free"].includes(t)));if(attrs.includes("snack"))rows=rows.filter(p=>p.category==="Snacks"||p.tags.includes("fruit")||p.tags.includes("protein"));if(attrs.includes("breakfast"))rows=rows.filter(p=>["Dairy","Bakery","Produce","Grains"].includes(p.category));const inCart=new Set(data?.list.map(x=>x.normalizedName)??[]);return rows.sort((a,b)=>(Number(inCart.has(a.normalizedName))-Number(inCart.has(b.normalizedName)))||(Number(b.onSale)-Number(a.onSale))||a.price-b.price).slice(0,6)}
export function rankSubstitutes(product:Product,attribute?:string){const ids=new Set(product.substituteIds??[]);return catalog.filter(p=>p.id!==product.id&&p.inStock&&(ids.has(p.id)||p.category===product.category||attribute&&p.tags.includes(attribute))).sort((a,b)=>(ids.has(a.id)?-1:0)-(ids.has(b.id)?-1:0)||a.price-b.price)}

export const defaultData:AppData={version:1,list:[],pantry:[],history:[],dismissed:[],activity:[],speechEnabled:false};
function migrateItem<T extends Pick<ShoppingItem,"unit"|"name"|"normalizedName"|"estimatedUnitPricePaise"|"estimatedUnitPrice">>(item:T):T{const clean={...item} as T&{brand?:unknown};delete clean.brand;const unit=canonicalUnit(item.unit),id="productId" in item&&typeof item.productId==="string"?item.productId:undefined,prices=productUnitPrice(catalog.find(p=>p.id===id),unit);return{...clean,unit,estimatedUnitPricePaise:prices?Math.round(prices.price*100):item.estimatedUnitPricePaise??Math.round((item.estimatedUnitPrice??50)*100),originalUnitPricePaise:prices?.original?Math.round(prices.original*100):"originalUnitPricePaise" in item?item.originalUnitPricePaise:undefined,normalizedName:normalizeItem(item.normalizedName||item.name)} as T}
export function loadData(raw:string|null):AppData{if(!raw)return defaultData;try{const value=JSON.parse(raw) as Partial<AppData>;if(value.version!==1||!Array.isArray(value.list))return defaultData;return{...defaultData,...value,list:value.list.map(migrateItem),pantry:(value.pantry??[]).map(migrateItem),history:(value.history??[]).map(migrateItem)}}catch{return defaultData}}
export const serializeData=(data:AppData)=>JSON.stringify(data);

export function suggestions(data:AppData,month=new Date().getMonth()+1):Suggestion[]{
  const out:Suggestion[]=[];for(const p of catalog){if(data.dismissed.includes(`season-${p.id}`))continue;if(p.seasonalMonths?.includes(month)&&p.inStock)out.push({id:`season-${p.id}`,product:p,title:`${p.name} are in season`,reason:"Based on the bundled seasonal catalog, not live inventory.",kind:"seasonal"});else if(p.onSale&&p.inStock)out.push({id:`sale-${p.id}`,product:p,title:`Estimated saving on ${p.name}`,reason:`Sample catalog price is ${formatMoney(p.price*100)}.`,kind:"sale"})}
  const counts=new Map<string,number>();for(const h of data.history)counts.set(h.normalizedName,(counts.get(h.normalizedName)??0)+1);for(const [name,count] of counts)if(count>=2){const p=catalog.find(x=>x.normalizedName===name&&x.inStock);if(p)out.unshift({id:`history-${p.id}`,product:p,title:`Buy ${p.name} again?`,reason:"You purchased this at least twice before.",kind:"history"})}return out.slice(0,4)
}

export function scoreTranscript(text:string,recognitionConfidence=0,cartProductNames:string[]=[]){const p=parseCommand(text),contextMatch=!!p.normalizedItem&&cartProductNames.includes(p.normalizedItem)&&["QUERY_QUANTITY","REMOVE_QUANTITY","REMOVE_ALL","SET_QUANTITY"].includes(p.intent);return p.confidence+(p.items?.length??0)*.08+(p.intent!=="UNKNOWN"?.15:0)+(contextMatch?.2:0)-(p.needsConfirmation?.08:0)+recognitionConfidence*.15}
