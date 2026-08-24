import { describe, expect, it } from "vitest";
import { catalog, categorize } from "./data";
import { applyCartCommand, defaultData, isParsedCommand, itemSubtotalPaise, loadData, makeItem, mergeItem, normalizeItem, normalizeTranscript, parseCommand, parseItems, rankSubstitutes, recommendProducts, serializeData, suggestions } from "./domain";
import { chooseBestTranscript, evaluateAlternatives, shouldExecuteFinal } from "./voice";
import type { AppData, HistoryItem } from "./types";

describe("shared transcript normalization",()=>{
  it.each([["1K ATA","1 kg atta"],["one K atta","1 kg atta"],["one kilo aata","1 kg atta"],["एक किलो आटा","1 kg atta"],["do packet dudh","2 packet milk"],["दो पैकेट दूध","2 packet milk"],["दूध.","milk"]])("normalizes %s",(raw,expected)=>expect(normalizeTranscript(raw)).toBe(expected));
  it.each(["milk","Milk","doodh","dudh","दूध"])("maps %s to canonical Milk",value=>expect(normalizeItem(value)).toBe("milk"));
  it("ranks grocery-aware speech alternatives",()=>expect(chooseBestTranscript([{transcript:"Add 1K ATA",confidence:.7},{transcript:"at one kay data",confidence:.8}]).transcript).toBe("Add 1K ATA"));
  it("uses cart context to recover quantity over quality",()=>expect(chooseBestTranscript([{transcript:"What is the quality of milk",confidence:.8},{transcript:"What is the quantity of milk",confidence:.55}],["milk"]).transcript).toBe("What is the quantity of milk"));
  it("lowers confidence when plausible alternatives mutate different items",()=>expect(evaluateAlternatives([{transcript:"add one kg atta",confidence:.8},{transcript:"add one kg sugar",confidence:.8}]).confidence).toBeLessThan(.6));
  it("executes duplicate final speech events only once",()=>{const first=shouldExecuteFinal({text:"",at:0},"add milk",1000);expect(first.execute).toBe(true);expect(shouldExecuteFinal(first.marker,"add milk",1500).execute).toBe(false);expect(shouldExecuteFinal(first.marker,"add milk",3100).execute).toBe(true)});
});

describe("intent parsing",()=>{
  it.each([["Add milk","ADD_ITEM","milk",1],["I want to buy bananas","ADD_ITEM","banana",1],["Doodh add karo","ADD_ITEM","milk",1],["Do packet doodh chahiye","ADD_ITEM","milk",2],["Add 2 bottles of water","ADD_ITEM","water",2],["Add five eggs","ADD_ITEM","egg",5],["Remove milk","REMOVE_ALL","milk",1],["Remove two packets of milk","REMOVE_QUANTITY","milk",2],["Change water to 4 bottles","SET_QUANTITY","water",4],["I only need three milk packets","SET_QUANTITY","milk",3],["How much milk do I have?","QUERY_QUANTITY","milk",1],["Tell me my entire list","QUERY_LIST",undefined,1],["I need one kilo atta","ADD_ITEM","atta",1],["atta chahiye ek kilo","ADD_ITEM","atta",1]])("parses %s",(text,intent,item,quantity)=>{const p=parseCommand(String(text));expect(p.intent).toBe(intent);expect(p.normalizedItem).toBe(item);expect(p.quantity??1).toBe(quantity)});
  it("uses one product per name and keeps price limits",()=>{const parsed=parseCommand("Show Colgate toothpaste");expect(parsed).toMatchObject({intent:"SEARCH_PRODUCT",normalizedItem:"toothpaste"});expect(parsed).not.toHaveProperty("brand");expect(new Set(catalog.map(p=>p.normalizedName)).size).toBe(catalog.length);expect(parseCommand("100 rupaye ke andar toothpaste dikhao")).toMatchObject({intent:"SEARCH_PRODUCT",maxPrice:100})});
  it("keeps recommendations out of add",()=>expect(parseCommand("Recommend me what to buy in fruits").intent).toBe("RECOMMEND_PRODUCTS"));
  it("supports recommendation follow-up selection",()=>expect(parseCommand("Add the first one")).toMatchObject({intent:"CHOOSE_PRODUCT",selectionIndex:0}));
  it("routes substitute recommendations before generic recommendations",()=>expect(parseCommand("Suggest something instead of butter")).toMatchObject({intent:"SHOW_SUBSTITUTES",normalizedItem:"butter"}));
  it("understands whole removal without a strict remove verb",()=>expect(parseCommand("अब दूध नहीं चाहिए")).toMatchObject({intent:"REMOVE_ALL",normalizedItem:"milk"}));
  it("flags noise as ambiguous",()=>expect(parseCommand("add 5x").confidence).toBeLessThan(.6));
  it("never treats an unmatched question as add",()=>expect(parseCommand("Is milk good for children?").intent).toBe("UNKNOWN"));
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
  it("marks fallback prices approximate",()=>expect(makeItem("dragon fruit")).toMatchObject({approximatePrice:true,estimatedUnitPricePaise:5000}));
  it("prorates catalog packs to the requested measurement",()=>expect(makeItem("Atta",1,"kg","text",catalog.find(p=>p.id==="aashirvaad-atta")).estimatedUnitPricePaise).toBe(5700));
  it("recommends within constraints",()=>expect(recommendProducts(parseCommand("Recommend fruits under ₹200")).every(x=>x.price<=200&&x.tags.includes("fruit"))).toBe(true));
  it("builds history and seasonal suggestions",()=>{const h={...makeItem("bread"),purchasedAt:new Date().toISOString()} as HistoryItem;expect(suggestions({...defaultData,history:[h,{...h,id:crypto.randomUUID()}]}).some(x=>x.kind==="history")).toBe(true);expect(suggestions(defaultData,5).some(x=>x.kind==="seasonal")).toBe(true)});
  it("ranks in-stock substitutes",()=>expect(rankSubstitutes(catalog.find(p=>p.id==="mother-milk")!)[0].id).toBe("sofit-almond"));
  it("migrates old saved units and prices without legacy brands",()=>{const item={...makeItem("milk"),brand:"Old brand",unit:"litre",estimatedUnitPricePaise:undefined,estimatedUnitPrice:56},data={...defaultData,list:[item]} as AppData,loaded=loadData(serializeData(data)).list[0];expect(loaded).toMatchObject({unit:"l",estimatedUnitPricePaise:5600});expect(loaded).not.toHaveProperty("brand")});
  it("recovers corrupt persistence",()=>expect(loadData("broken")).toEqual(defaultData));
});
