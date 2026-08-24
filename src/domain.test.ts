import { describe, expect, it } from "vitest";
import { catalog, categorize } from "./data";
import { applyCartCommand, defaultData, isParsedCommand, itemSubtotalPaise, loadData, makeItem, mergeItem, normalizeItem, normalizeTranscript, parseCommand, parseItems, rankSubstitutes, recommendProducts, searchProducts, serializeData, suggestions } from "./domain";
import { chooseBestTranscript, evaluateAlternatives, recognitionEndMessage, shouldExecuteFinal } from "./voice";
import type { AppData, HistoryItem } from "./types";

describe("shared transcript normalization",()=>{
  it.each([["1K ATA","1 kg atta"],["one K atta","1 kg atta"],["one kilo aata","1 kg atta"],["एक किलो आटा","1 kg atta"],["do packet dudh","2 packet milk"],["दो पैकेट दूध","2 packet milk"],["दूध.","milk"]])("normalizes %s",(raw,expected)=>expect(normalizeTranscript(raw)).toBe(expected));
  it.each(["milk","Milk","doodh","dudh","दूध"])("maps %s to canonical Milk",value=>expect(normalizeItem(value)).toBe("milk"));
  it("ranks grocery-aware speech alternatives",()=>expect(chooseBestTranscript([{transcript:"Add 1K ATA",confidence:.7},{transcript:"at one kay data",confidence:.8}]).transcript).toBe("Add 1K ATA"));
  it("uses cart context to recover quantity over quality",()=>expect(chooseBestTranscript([{transcript:"What is the quality of milk",confidence:.8},{transcript:"What is the quantity of milk",confidence:.55}],["milk"]).transcript).toBe("What is the quantity of milk"));
  it("lowers confidence when plausible alternatives mutate different items",()=>expect(evaluateAlternatives([{transcript:"add one kg atta",confidence:.8},{transcript:"add one kg sugar",confidence:.8}]).confidence).toBeLessThan(.6));
  it("executes duplicate final speech events only once",()=>{const first=shouldExecuteFinal({text:"",at:0},"add milk",1000);expect(first.execute).toBe(true);expect(shouldExecuteFinal(first.marker,"add milk",1500).execute).toBe(false);expect(shouldExecuteFinal(first.marker,"add milk",3100).execute).toBe(true)});
  it("explains empty or incomplete recognition without executing it",()=>{expect(recognitionEndMessage(false,false,false)).toBe("No speech was detected. Try again.");expect(recognitionEndMessage(true,false,false)).toContain("nothing was executed");expect(recognitionEndMessage(true,true,false)).toBeUndefined();expect(recognitionEndMessage(false,false,true)).toBeUndefined()});
});

describe("intent parsing",()=>{
  it.each([["Add milk","ADD_ITEM","milk",1],["I want to buy bananas","ADD_ITEM","banana",1],["Doodh add karo","ADD_ITEM","milk",1],["Do packet doodh chahiye","ADD_ITEM","milk",2],["Add 2 bottles of water","ADD_ITEM","water",2],["Add five eggs","ADD_ITEM","egg",5],["Remove milk","REMOVE_ALL","milk",1],["Remove two packets of milk","REMOVE_QUANTITY","milk",2],["Change water to 4 bottles","SET_QUANTITY","water",4],["I only need three milk packets","SET_QUANTITY","milk",3],["How much milk do I have?","QUERY_QUANTITY","milk",1],["Tell me my entire list","QUERY_LIST",undefined,1],["I need one kilo atta","ADD_ITEM","atta",1],["atta chahiye ek kilo","ADD_ITEM","atta",1]])("parses %s",(text,intent,item,quantity)=>{const p=parseCommand(String(text));expect(p.intent).toBe(intent);expect(p.normalizedItem).toBe(item);expect(p.quantity??1).toBe(quantity)});
  it("keeps catalog variants and price limits",()=>{const parsed=parseCommand("Show Colgate toothpaste");expect(parsed).toMatchObject({intent:"SEARCH_PRODUCT",normalizedItem:"toothpaste",brand:"Colgate"});expect(catalog.filter(p=>p.normalizedName==="toothpaste").length).toBeGreaterThan(1);expect(parseCommand("100 rupaye ke andar toothpaste dikhao")).toMatchObject({intent:"SEARCH_PRODUCT",maxPrice:100})});
  it("keeps recommendations out of add",()=>expect(parseCommand("Recommend me what to buy in fruits").intent).toBe("RECOMMEND_PRODUCTS"));
  it("supports recommendation follow-up selection",()=>expect(parseCommand("Add the first one")).toMatchObject({intent:"CHOOSE_PRODUCT",selectionIndex:0}));
  it("routes substitute recommendations before generic recommendations",()=>expect(parseCommand("Suggest something instead of butter")).toMatchObject({intent:"SHOW_SUBSTITUTES",normalizedItem:"butter"}));
  it("understands whole removal without a strict remove verb",()=>expect(parseCommand("अब दूध नहीं चाहिए")).toMatchObject({intent:"REMOVE_ALL",normalizedItem:"milk"}));
  it("flags noise as ambiguous",()=>expect(parseCommand("add 5x").confidence).toBeLessThan(.6));
  it("never treats an unmatched question as add",()=>expect(parseCommand("Is milk good for children?").intent).toBe("UNKNOWN"));
});

describe("code-switched parsing regressions",()=>{
  it.each([
    ["Add ek pani ki bottle","ADD_ITEM","water",1,"bottle"],
    ["Add ek kilo tamatar","ADD_ITEM","tomato",1,"kg"],
    ["Ek kilo tamatar chahiye","ADD_ITEM","tomato",1,"kg"],
    ["Add 1 bottle of water","ADD_ITEM","water",1,"bottle"],
    ["Add do packet doodh","ADD_ITEM","milk",2,"packet"],
    ["Remove ek bottle water","REMOVE_QUANTITY","water",1,"bottle"],
    ["ADD EK PAANI KI BOTTLE.","ADD_ITEM","water",1,"bottle"]
  ])("parses %s without grammar in the product name",(text,intent,item,quantity,unit)=>expect(parseCommand(text)).toMatchObject({intent,normalizedItem:item,quantity,unit}));
  it("combines a localized price number with English search",()=>expect(parseCommand("Find toothpaste sau rupaye ke andar")).toMatchObject({intent:"SEARCH_PRODUCT",normalizedItem:"toothpaste",maxPrice:100}));
  it.each(["Meri list main kya hai","Meri list mein kya hai","Meri list me kya hai","Mere list mein kya hai","Meri shopping list batao","Maine kya add kiya hai","What is my list?","What is in my cart?","मेरी लिस्ट में क्या है","मेरी list में क्या है"])('routes "%s" as a read-only list question',text=>{const list=[makeItem("Water",1,"bottle"),makeItem("Tomatoes",1,"kg")],before=serializeData({...defaultData,list}),command=parseCommand(text),result=applyCartCommand(list,command);expect(command.intent).toBe("QUERY_LIST");expect(result.changed).toBe(false);expect(result.list).toBe(list);expect(serializeData({...defaultData,list})).toBe(before);expect(result.message).toMatch(/2 (?:products|उत्पाद)/)});
});

describe("natural clear-list intent",()=>{
  it.each(["Clear my list","Delete my list","Remove everything from my list","Remove all items from my list","Meri list khali karo","मेरी सूची खाली करो"])('routes "%s" through the confirmed full-list action',text=>expect(parseCommand(text)).toMatchObject({intent:"CLEAR_LIST",confidence:.96}));
  it("does not confuse a product-wide removal with clearing the cart",()=>expect(parseCommand("Remove all milk")).toMatchObject({intent:"REMOVE_ALL",normalizedItem:"milk"}));
});

const mixedLanguageCases=[
  ["English","Add one packet milk","What is in my cart"],
  ["Hinglish","Add ek packet doodh","Meri list main kya hai"],
  ["Hindi","Add एक पैकेट दूध","मेरी list में क्या है"],
  ["Bengali","Add এক প্যাকেট দুধ","আমার list এ কি আছে"],
  ["Marathi","Add दोन पैकेट दूध","माझी list मध्ये काय आहे"],
  ["Gujarati","Add એક પેકેટ દૂધ","મારી list માં શું છે"],
  ["Punjabi","Add ਇੱਕ ਪੈਕੇਟ ਦੁੱਧ","ਮੇਰੀ list ਵਿੱਚ ਕੀ ਹੈ"],
  ["Tamil","Add ஒன்று பாக்கெட் பால்","என் list இல் என்ன உள்ளது"],
  ["Telugu","Add ఒక ప్యాకెట్ పాలు","నా list లో ఏమి ఉంది"],
  ["Kannada","Add ಒಂದು ಪ್ಯಾಕೆಟ್ ಹಾಲು","ನನ್ನ list ನಲ್ಲಿ ಏನು ಇದೆ"],
  ["Malayalam","Add ഒന്ന് പാക്കറ്റ് പാൽ","എന്റെ list ൽ എന്ത് ഉണ്ട്"],
  ["Urdu","Add ایک پیکٹ دودھ","میری list میں کیا ہے"]
] as const;
describe.each(mixedLanguageCases)("%s code switching",(_language,add,list)=>{
  it("combines an English action with localized entities",()=>expect(parseCommand(add)).toMatchObject({intent:"ADD_ITEM",normalizedItem:"milk",unit:"packet"}));
  it("keeps a mixed-script list question read-only",()=>expect(parseCommand(list).intent).toBe("QUERY_LIST"));
});

describe("question mutation safety",()=>{
  const milk=()=>({...makeItem("Milk",5,"packet"),estimatedUnitPricePaise:6000});
  it.each(["What is the quantity of milk?","How much milk do I have?","Milk kitna hai?","दूध कितना है?"])("keeps the cart byte-identical for %s",text=>{const list=[milk()],before=JSON.stringify(list),result=applyCartCommand(list,parseCommand(text));expect(result.changed).toBe(false);expect(JSON.stringify(result.list)).toBe(before);expect(result.message).toContain("5")});
  it("clarifies quality/quantity without adding",()=>{const list=[milk()],command=parseCommand("What is the quality of milk?");expect(command).toMatchObject({intent:"QUERY_QUANTITY",needsConfirmation:true});expect(JSON.stringify(applyCartCommand(list,command).list)).toBe(JSON.stringify(list))});
  it("rejects invalid structured or AI output",()=>{expect(isParsedCommand({intent:"ADD_ITEM",confidence:2,rawTranscript:"add milk"})).toBe(false);expect(isParsedCommand({intent:"DROP_DATABASE",confidence:1,rawTranscript:"anything"})).toBe(false)});
});

describe("canonical Besan operations",()=>{
  const besanProduct=catalog.find(p=>p.normalizedName==="besan")!;
  const besan=()=>makeItem("Besan",1,"kg","text",besanProduct);
  it.each(["besan","basen","basin","besan.","बेसन","beसन","gram flour","chickpea flour"])("resolves %s",word=>expect(parseCommand(`Remove ${word}`).normalizedItem).toBe("besan"));
  it("confirms and removes all Besan",()=>{const list=[besan()],command=parseCommand("Remove besan"),prompt=applyCartCommand(list,command);expect(prompt.needsConfirmation).toBe(true);expect(applyCartCommand(list,{...command,confidence:1}).list).toHaveLength(0)});
  it("treats remove-the-quantity as whole removal",()=>expect(parseCommand("Remove the quantity of basin")).toMatchObject({intent:"REMOVE_ALL",normalizedItem:"besan",needsConfirmation:true}));
  it("subtracts half a kilo",()=>expect(applyCartCommand([besan()],parseCommand("Remove half kilo besan")).list[0].quantity).toBe(.5));
  it("sets the final quantity",()=>expect(applyCartCommand([besan()],parseCommand("Make besan half kilo")).list[0].quantity).toBe(.5));
  it("asks for a missing reduction amount",()=>{const list=[besan()],result=applyCartCommand(list,parseCommand("Reduce besan quantity"));expect(result.changed).toBe(false);expect(result.list).toBe(list);expect(result.message).toContain("How much")});
  it.each(["Besan hata do","बेसन हटा दो"])("understands %s",text=>expect(parseCommand(text)).toMatchObject({intent:"REMOVE_ALL",normalizedItem:"besan"}));
});

describe("natural food recommendations",()=>{
  it.each(["Tell me something to eat","What should I have for breakfast?","I'm hungry","Something healthy under ₹200","Kuch khane ko batao","आज क्या खाऊं?"])("routes %s without mutation",text=>{const data={...defaultData,list:[makeItem("Milk",1,"packet")]},before=serializeData(data),command=parseCommand(text),rows=recommendProducts(command,data);expect(command.intent).toBe("RECOMMEND_PRODUCTS");expect(rows.length).toBeGreaterThan(0);expect(rows.every(p=>!["Beverages","Household","Personal Care"].includes(p.category))).toBe(true);expect(serializeData(data)).toBe(before)});
  it("supports conversational refinements",()=>{expect(parseCommand("Something healthier").intent).toBe("RECOMMEND_PRODUCTS");expect(parseCommand("Show cheaper options").intent).toBe("RECOMMEND_PRODUCTS");expect(parseCommand("Under ₹100")).toMatchObject({intent:"RECOMMEND_PRODUCTS",maxPrice:100});expect(parseCommand("Anything without milk?")).toMatchObject({intent:"RECOMMEND_PRODUCTS",attributes:expect.arrayContaining(["without:milk"])});expect(parseCommand("I don't like that").intent).toBe("RECOMMEND_PRODUCTS")});
  it("does not rank cooking staples as ready-to-eat suggestions",()=>expect(recommendProducts(parseCommand("Tell me something to eat")).map(p=>p.normalizedName)).not.toContain("salt"));
});

describe("quantities, units, and product extraction",()=>{
  it.each([["add half kilo sugar","sugar",.5,"kg"],["ek kilo shakkar add karo","sugar",1,"kg"],["do kilo bajra chahiye","bajra",2,"kg"],["add one and a half kilos of rice","rice",1.5,"kg"],["aadha kilo atta","atta",.5,"kg"],["dedh kilo atta","atta",1.5,"kg"]])("extracts %s",(text,item,quantity,unit)=>expect(parseCommand(String(text)).items?.[0]).toMatchObject({normalizedItem:item,quantity,unit}));
  it.each([
    ["Add 250 g almonds",250,"g"],["Add 1/2 kg apples",.5,"kg"],["Add ½ kg apples",.5,"kg"],["Add half kg atta",.5,"kg"],
    ["Add 1.5 kg rice",1.5,"kg"],["Add one point five kg rice",1.5,"kg"],["Add kilo onions",1,"kg"],
    ["Add half dozen eggs",.5,"dozen"],["Add 1 dozen eggs",1,"dozen"],["Add dozen eggs",1,"dozen"]
  ])("understands practical measurement %s",(text,quantity,unit)=>expect(parseCommand(text)).toMatchObject({intent:"ADD_ITEM",quantity,unit}));
  it("splits lists without measurements in names",()=>expect(parseItems("add one kg onion one kg tomato one kg potato").map(x=>[x.normalizedItem,x.quantity,x.unit])).toEqual([["onion",1,"kg"],["tomato",1,"kg"],["potato",1,"kg"]]));
  it("preserves multi-word products",()=>expect(parseItems("add olive oil ice cream green tea").map(x=>x.normalizedItem)).toEqual(["olive oil","ice cream","green tea"]));
  it("drops conversational fillers",()=>expect(parseCommand("Umm can you please add you know two kilos of onions and maybe one milk").items?.map(x=>x.normalizedItem)).toEqual(["onion","milk"]));
});

describe("cart operations",()=>{
  const milk=()=>({...makeItem("Milk",5,"packet"),estimatedUnitPricePaise:6000});
  it.each(["Remove two packets of milk","दो पैकेट दूध हटाओ","Milk ke do packet kam kar do"])("partially removes for %s",text=>{const result=applyCartCommand([milk()],parseCommand(text));expect(result.changed).toBe(true);expect(result.list[0].quantity).toBe(3);expect(result.message).toContain("3")});
  it("sets an absolute quantity",()=>expect(applyCartCommand([milk()],parseCommand("I only need three milk packets")).list[0].quantity).toBe(3));
  it.each(["How much milk do I have?","Milk kitna hai?","दूध कितना है?"])("answers %s without mutation",text=>{const list=[milk()],result=applyCartCommand(list,parseCommand(text));expect(result.list).toBe(list);expect(result.changed).toBe(false);expect(result.message).toContain("5 packets")});
  it("answers a complete-list request without mutation",()=>{const list=[milk(),makeItem("Atta",1,"kg")],result=applyCartCommand(list,parseCommand("Tell me my entire list"));expect(result.list).toBe(list);expect(result.message).toContain("2 products")});
  it("asks before unsafe removal",()=>{expect(applyCartCommand([milk()],parseCommand("Remove 8 packets milk")).needsConfirmation).toBe(true);expect(applyCartCommand([milk()],parseCommand("Remove 2 kg milk")).needsConfirmation).toBe(true);expect(applyCartCommand([milk()],parseCommand("I do not need milk anymore")).needsConfirmation).toBe(true)});
});

const languageCases=[
  ["English","I need one kilo atta","Remove two packets of milk","How much milk do I have","Tell me my entire list","I'm hungry"],
  ["Hinglish","atta chahiye ek kilo","Milk ke do packet kam kar do","Milk kitna hai","Meri list mein kya hai","Kuch khane ko batao"],
  ["Hindi","एक किलो आटा चाहिए","दो पैकेट दूध हटाओ","दूध कितना है","मेरी पूरी सूची बताओ","आज क्या खाऊं"],
  ["Bengali","এক কিলো আটা চাই","দুই প্যাকেট দুধ সরাও","দুধ কত","আমার তালিকা বলো","আমি ক্ষুধার্ত"],
  ["Marathi","एक किलो आटा चाहिए","दो पैकेट दूध हटाओ","दूध कितना","मेरी पूरी लिस्ट बताओ","मी भुकेला आहे सुचवा"],
  ["Gujarati","એક કિલો પીંઠ જોઈએ","બે પેકેટ દૂધ કાઢ","દૂધ કેટલું","મારી યાદી બતાવો","મને ભૂખ લાગી"],
  ["Punjabi","ਇੱਕ ਕਿਲੋ ਆਟਾ ਚਾਹੀਦਾ","ਦੋ ਪੈਕੇਟ ਦੁੱਧ ਹਟਾਓ","ਦੁੱਧ ਕਿੰਨਾ","ਮੇਰੀ ਸੂਚੀ ਦੱਸੋ","ਮੈਨੂੰ ਭੁੱਖ ਲੱਗੀ"],
  ["Tamil","ஒன்று கிலோ மாவு வேண்டும்","இரண்டு பாக்கெட் பால் நீக்கு","பால் எவ்வளவு","என் பட்டியல் சொல்லு","எனக்கு பசிக்கிறது"],
  ["Telugu","ఒక కిలో పిండి కావాలి","రెండు ప్యాకెట్ పాలు తొలగించు","పాలు ఎంత","నా జాబితా చెప్పు","నాకు ఆకలిగా ఉంది"],
  ["Kannada","ಒಂದು ಕಿಲೋ ಹಿಟ್ಟು ಬೇಕು","ಎರಡು ಪ್ಯಾಕೆಟ್ ಹಾಲು ತೆಗೆ","ಹಾಲು ಎಷ್ಟು","ನನ್ನ ಪಟ್ಟಿ ಹೇಳು","ನನಗೆ ಹಸಿವಾಗಿದೆ"],
  ["Malayalam","ഒന്ന് കിലോ മാവ് വേണം","രണ്ട് പാക്കറ്റ് പാൽ നീക്ക","പാൽ എത്ര","എന്റെ പട്ടിക പറയൂ","എനിക്ക് വിശക്കുന്നു"],
  ["Urdu","ایک کلو آٹا چاہیے","دو پیکٹ دودھ ہٹا دو","دودھ کتنا","میری فہرست بتاؤ","مجھے بھوک لگی ہے"]
] as const;
describe.each(languageCases)("%s language parity",(_language,add,remove,quantity,list,recommend)=>{
  it("natural add",()=>expect(parseCommand(add)).toMatchObject({intent:"ADD_ITEM",normalizedItem:"atta",quantity:1,unit:"kg"}));
  it("partial removal",()=>expect(parseCommand(remove)).toMatchObject({intent:"REMOVE_QUANTITY",normalizedItem:"milk",quantity:2,unit:"packet"}));
  it("quantity query",()=>expect(parseCommand(quantity)).toMatchObject({intent:"QUERY_QUANTITY",normalizedItem:"milk"}));
  it("list query",()=>expect(parseCommand(list).intent).toBe("QUERY_LIST"));
  it("recommendation",()=>expect(parseCommand(recommend).intent).toBe("RECOMMEND_PRODUCTS"));
});

describe("existing domain and persistence behavior",()=>{
  it("categorizes and merges compatible items",()=>{expect(categorize("milk")).toBe("Dairy");const a=makeItem("milk",1,"l");expect(mergeItem([a],makeItem("milk",2,"l"))[0].quantity).toBe(3);expect(mergeItem([a],makeItem("milk",1,"packet"))).toHaveLength(2)});
  it("calculates paise subtotals",()=>{const onion={...makeItem("onion",2,"kg"),estimatedUnitPricePaise:4000};expect(itemSubtotalPaise(onion)).toBe(8000)});
  it("derives approximate fallback prices from the catalog instead of a fixed ₹50",()=>{const item=makeItem("dragon fruit");expect(item.approximatePrice).toBe(true);expect(item.estimatedUnitPricePaise).toBeGreaterThan(0);expect(item.estimatedUnitPricePaise).not.toBe(5000)});
  it("prorates catalog packs to the requested measurement",()=>expect(makeItem("Atta",1,"kg","text",catalog.find(p=>p.id==="aashirvaad-atta")).estimatedUnitPricePaise).toBe(5700));
  it("updates compatible cart measurements and prorates their market estimate",()=>{let list=mergeItem([],makeItem("Almonds",250,"g"));list=mergeItem(list,makeItem("Almonds",.5,"kg"));expect(list[0]).toMatchObject({quantity:750,unit:"g"});expect(itemSubtotalPaise(list[0])).toBe(Math.round(list[0].estimatedUnitPricePaise!*750))});
  it("prices half a dozen eggs as six pieces",()=>{const eggs=makeItem("Eggs",.5,"dozen","text",catalog.find(p=>p.id==="farm-eggs"));expect(eggs.estimatedUnitPricePaise).toBe(14400);expect(itemSubtotalPaise(eggs)).toBe(7200)});
  it("scales a generic food estimate with the requested quantity",()=>{const small=makeItem("Quinoa",250,"g"),large=makeItem("Quinoa",500,"g");expect(small.approximatePrice).toBe(true);expect(small.estimatedUnitPricePaise).toBeGreaterThan(0);expect(itemSubtotalPaise(large)).toBe(itemSubtotalPaise(small)*2)});
  it("recommends within constraints",()=>expect(recommendProducts(parseCommand("Recommend fruits under ₹200")).every(x=>x.price<=200&&x.tags.includes("fruit"))).toBe(true));
  it("builds history and seasonal suggestions",()=>{const h={...makeItem("bread"),purchasedAt:new Date().toISOString()} as HistoryItem;expect(suggestions({...defaultData,history:[h,{...h,id:crypto.randomUUID()}]}).some(x=>x.kind==="history")).toBe(true);expect(suggestions(defaultData,5).some(x=>x.kind==="seasonal")).toBe(true)});
  it("ranks in-stock substitutes",()=>expect(rankSubstitutes(catalog.find(p=>p.id==="mother-milk")!)[0].id).toBe("sofit-almond"));
  it("migrates old saved units, prices, and catalog identity",()=>{const item={...makeItem("milk"),brand:"Old brand",unit:"litre",estimatedUnitPricePaise:undefined,estimatedUnitPrice:56},data={...defaultData,list:[item]} as AppData,loaded=loadData(serializeData(data)).list[0];expect(loaded).toMatchObject({unit:"l",estimatedUnitPricePaise:5600,brand:"Mother Dairy"})});
  it("recovers corrupt persistence",()=>expect(loadData("broken")).toEqual(defaultData));
});

describe("completed multilingual catalog requirements",()=>{
  it.each([
    ["Buy five pieces of oranges",5],["Buy five oranges",5],["Add five piece orange",5],["Paanch santre chahiye",5],["पाँच संतरे चाहिए",5],
    ["Buy ५ oranges",5],["Buy ৫ oranges",5],["Buy ૫ oranges",5],["Buy ੫ oranges",5],["Buy ௫ oranges",5],["Buy ౫ oranges",5],["Buy ೫ oranges",5],["Buy ൫ oranges",5],["Buy ۵ oranges",5]
  ])("counts %s",(text,quantity)=>expect(parseCommand(text)).toMatchObject({intent:"ADD_ITEM",normalizedItem:"orange",quantity}));

  it.each([
    ["Find toothpaste under Rs 100",undefined,100],["Find toothpaste under Rs. 100",undefined,100],["Find toothpaste below ₹100",undefined,100],["Show toothpaste less than 100 rupees",undefined,100],["100 rupaye ke andar toothpaste dikhao",undefined,100],["₹50 se ₹100 ke beech toothpaste dikhao",50,100],["Find toothpaste under INR 100",undefined,100]
  ])("normalizes INR range in %s",(text,minPrice,maxPrice)=>{const command=parseCommand(text);expect(command).toMatchObject({intent:"SEARCH_PRODUCT",normalizedItem:"toothpaste",maxPrice});expect(command.minPrice).toBe(minPrice);expect(searchProducts(command).every(p=>p.price<=(maxPrice??Infinity)&&p.price>=(minPrice??0))).toBe(true)});

  it.each(["What is the cost of toothbrush?","How much does a toothbrush cost?","What is the price of Colgate toothbrush?","Toothbrush kitne ka hai?","टूथब्रश कितने का है?"])("routes price query: %s",text=>{const list=[makeItem("Milk")],before=serializeData({...defaultData,list}),command=parseCommand(text);expect(command.intent).toBe("PRICE_QUERY");expect(catalog.filter(p=>p.normalizedName===command.normalizedItem).length).toBeGreaterThan(1);expect(serializeData({...defaultData,list})).toBe(before)});

  it.each([["flour","atta"],["atta","atta"],["whole wheat flour","atta"],["all-purpose flour","maida"],["maida","maida"],["besan","besan"]])("maps %s to %s",(value,expected)=>expect(normalizeItem(value)).toBe(expected));
  it("keeps flour taxonomy canonical and distinct",()=>{for(const name of ["atta","maida","besan"])expect(catalog.filter(p=>p.normalizedName===name).every(p=>p.category==="Grains & Flours")).toBe(true);const atta=makeItem("flour",1,"kg"),merged=mergeItem([atta],makeItem("atta",2,"kg"));expect(merged).toHaveLength(1);expect(merged[0].quantity).toBe(3);expect(mergeItem(merged,makeItem("maida",1,"kg"))).toHaveLength(2)});

  it.each(["Find me dhaniya","Show coriander","Dhaniya dikhao","धनिया दिखाओ"])("searches dhaniya without mutation: %s",text=>{const command=parseCommand(text),results=searchProducts(command);expect(command).toMatchObject({intent:"SEARCH_PRODUCT",normalizedItem:"coriander"});expect(results).toHaveLength(3);expect(results.map(p=>p.category)).toEqual(expect.arrayContaining(["Produce","Spices"]));expect(results.map(p=>p.name)).toEqual(expect.arrayContaining(["Fresh coriander leaves","Coriander seeds","Coriander powder"]))});

  it("migrates legacy Pantry products once and merges compatible duplicates",()=>{const list=makeItem("Milk",2,"packet"),pantry={...makeItem("doodh",3,"packet"),lowStock:true};delete pantry.productId;const legacy=JSON.stringify({version:1,list:[list],pantry:[pantry],history:[],dismissed:[],activity:[],speechEnabled:false}),loaded=loadData(legacy);expect(loaded).toMatchObject({version:2,migrationVersion:2});expect(loaded.list).toHaveLength(1);expect(loaded.list[0].quantity).toBe(5);expect(loadData(serializeData(loaded)).list[0].quantity).toBe(5);expect(serializeData(loaded)).not.toContain("pantry")});
  it("contains no Pantry category and every product has a reusable photo coordinate",()=>{expect(catalog.some(p=>String(p.category).toLowerCase()==="pantry")).toBe(false);expect(catalog.every(p=>Number.isInteger(p.photoIndex)&&p.photoIndex>=0&&p.photoIndex<36)).toBe(true)});
  it.each(["Is milk good for children?","Tell me a joke","Maybe later"])("keeps unknown text read-only: %s",text=>expect(parseCommand(text).intent).toBe("UNKNOWN"));
});

describe("nuts, produce, and safe custom food handling",()=>{
  it.each([
    ["Add 50 grams of almonds","almond",50,"g","almonds"],
    ["Add 250 grams of fox nuts","fox nut",250,"g","fox-nuts"],
    ["Add 250 grams of cashew nuts","cashew",250,"g","cashews"],
    ["Add one lemon","lemon",1,"piece","lemon"],
    ["Add two pieces of coconut","coconut",2,"piece","coconut"]
  ])("parses %s into catalog identity and measurement",(text,name,quantity,unit,productId)=>expect(parseCommand(text)).toMatchObject({intent:"ADD_ITEM",normalizedItem:name,quantity,unit,productId}));

  it.each([
    ["badam","almond"],["बादाम","almond"],["মাখানা","fox nut"],["મખાણા","fox nut"],["ਕਾਜੂ","cashew"],["முந்திரி","cashew"],
    ["neembu","lemon"],["नींबू","lemon"],["నిమ్మకాయ","lemon"],["nariyal","coconut"],["नारियल","coconut"],["തേങ്ങ","coconut"]
  ])("resolves %s to %s",(value,expected)=>expect(normalizeItem(value)).toBe(expected));

  it("merges aliases and compatible weight units without duplicate rows",()=>{let list=mergeItem([],makeItem("Almonds",50,"g"));list=mergeItem(list,makeItem("Badam",100,"g"));list=mergeItem(list,makeItem("बादाम",.1,"kg"));expect(list).toHaveLength(1);expect(list[0]).toMatchObject({productId:"almonds",quantity:250,unit:"g"})});
  it("merges duplicate lemon and coconut commands",()=>{const lemons=mergeItem([makeItem("Lemon",1,"piece")],makeItem("Nimbu",2,"piece")),coconuts=mergeItem([makeItem("Coconut",1,"piece")],makeItem("Nariyal",2,"piece"));expect(lemons).toHaveLength(1);expect(lemons[0].quantity).toBe(3);expect(coconuts).toHaveLength(1);expect(coconuts[0].quantity).toBe(3)});

  it.each([
    ["Ek lemon hatao",2],["एक नींबू हटाओ",2],["Do nimbu hata do",1]
  ])("removes lemon naturally: %s",(text,remaining)=>expect(applyCartCommand([makeItem("Lemon",3,"piece")],parseCommand(text)).list[0].quantity).toBe(remaining));
  it("removes compatible weights and asks for missing or incompatible measurements",()=>{const cashews=[makeItem("Cashews",500,"g")],almonds=[makeItem("Almonds",150,"g")];expect(applyCartCommand(cashews,parseCommand("250 gram kaju hatao")).list[0].quantity).toBe(250);expect(applyCartCommand(almonds,parseCommand("Badam mein se 50 gram kam karo")).list[0].quantity).toBe(100);expect(applyCartCommand(almonds,parseCommand("Badam kam karo"))).toMatchObject({changed:false,message:expect.stringContaining("How much")});expect(applyCartCommand(almonds,parseCommand("Remove 1 piece badam"))).toMatchObject({changed:false,needsConfirmation:true})});
  it("confirms whole coconut removal",()=>{const list=[makeItem("Coconut",2,"piece")],command=parseCommand("Nariyal nikaal do");expect(command).toMatchObject({intent:"REMOVE_ALL",needsConfirmation:true});expect(applyCartCommand(list,{...command,confidence:1,needsConfirmation:false}).list).toHaveLength(0)});

  it.each([
    ["English","Add one lemon","Remove one lemon"],["Hinglish","Ek nimbu chahiye","Ek nimbu hatao"],["Hindi","एक नींबू चाहिए","एक नींबू हटाओ"],
    ["Bengali","এক লেবু চাই","এক লেবু সরাও"],["Marathi","एक लिंबू द्या","एक लिंबू काढा"],["Gujarati","એક લીંબુ જોઈએ","એક લીંબુ કાઢ"],
    ["Punjabi","ਇੱਕ ਨਿੰਬੂ ਚਾਹੀਦਾ","ਇੱਕ ਨਿੰਬੂ ਹਟਾ"],["Tamil","ஒன்று எலுமிச்சை வேண்டும்","ஒன்று எலுமிச்சை நீக்கு"],
    ["Telugu","ఒక నిమ్మకాయ కావాలి","ఒక నిమ్మకాయ తొలగించు"],["Kannada","ಒಂದು ನಿಂಬೆ ಬೇಕು","ಒಂದು ನಿಂಬೆ ತೆಗೆ"],
    ["Malayalam","ഒന്ന് നാരങ്ങ വേണം","ഒന്ന് നാരങ്ങ നീക്ക"],["Urdu","ایک لیموں چاہیے","ایک لیموں ہٹا"]
  ])("supports %s add and removal",(_language,add,remove)=>{expect(parseCommand(add)).toMatchObject({intent:"ADD_ITEM",normalizedItem:"lemon",quantity:1});expect(parseCommand(remove)).toMatchObject({intent:expect.stringMatching(/^REMOVE_/),normalizedItem:"lemon",quantity:1})});

  it("keeps unknown edible items clean and pending confirmation",()=>expect(parseCommand("Add 250 grams of quinoa")).toMatchObject({intent:"ADD_ITEM",normalizedItem:"quinoa",quantity:250,unit:"g",confidence:.5}));
  it("suggests a close catalog typo but still requires confirmation",()=>expect(parseCommand("Add almnd")).toMatchObject({intent:"ADD_ITEM",normalizedItem:"almond",confidence:.5}));
  it("does not turn garnish ambiguity or an unknown question into a cart mutation",()=>{expect(parseCommand("Add garnish")).toMatchObject({intent:"UNKNOWN",needsConfirmation:true});expect(parseCommand("Is quinoa suitable for children?").intent).toBe("UNKNOWN")});
  it("uses food categories, paise pricing, and the second local photo sheet",()=>{for(const id of ["almonds","fox-nuts","cashews"]){const product=catalog.find(p=>p.id===id)!;expect(product).toMatchObject({category:"Dry Fruits & Nuts",photoSheet:1});expect(makeItem(product.name,1,product.unit,"text",product).estimatedUnitPricePaise).toBeGreaterThan(0)}for(const id of ["lemon","coconut"])expect(catalog.find(p=>p.id===id)).toMatchObject({category:"Produce",photoSheet:1})});
});

describe("open catalog fallback",()=>{
  it.each([
    ["Add 2 USB cables","usb cable",2,""],
    ["I need a yoga mat","yoga mat",1,""],
    ["Add 250 g quinoa","quinoa",250,"g"],
    ["दो पैकेट क्विनोआ चाहिए","क्विनोआ",2,"packet"]
  ])("accepts an unknown purchasable product: %s",(text,name,quantity,unit)=>expect(parseCommand(text)).toMatchObject({intent:"ADD_ITEM",normalizedItem:name,quantity,unit,confidence:.5}));

  it("manages a confirmed custom product like a catalog item",()=>{
    const list=[makeItem("USB Cable",2,"piece")];
    expect(parseCommand("How many USB cables do I have?")).toMatchObject({intent:"QUERY_QUANTITY",normalizedItem:"usb cable"});
    expect(applyCartCommand(list,parseCommand("How many USB cables do I have?")).message).toContain("2");
    expect(applyCartCommand(list,parseCommand("Remove one USB cable")).list[0].quantity).toBe(1);
    expect(applyCartCommand(list,parseCommand("Set USB cables to three")).list[0].quantity).toBe(3);
  });

  it("keeps unknown discovery and pricing read-only",()=>{
    expect(parseCommand("Find yoga mat")).toMatchObject({intent:"SEARCH_PRODUCT",normalizedItem:"yoga mat"});
    expect(parseCommand("What is the price of yoga mat?")).toMatchObject({intent:"PRICE_QUERY",normalizedItem:"yoga mat"});
  });
});
