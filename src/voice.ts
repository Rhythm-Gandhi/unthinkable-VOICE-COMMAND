import { parseCommand, scoreTranscript } from "./domain";

export type VoiceState = "idle" | "requesting" | "listening" | "processing" | "success" | "error" | "unsupported";
type Alternative = { transcript:string; confidence:number };
type RecognitionResult = { [key:number]: Alternative; isFinal:boolean; length:number };
type RecognitionEvent = Event & { resultIndex:number; results: { [key:number]: RecognitionResult; length:number } };
type RecognitionErrorEvent = Event & { error:string };
interface Recognition { lang:string; interimResults:boolean; continuous:boolean; maxAlternatives:number; start():void; stop():void; abort():void; onstart:null|(()=>void); onresult:null|((e:RecognitionEvent)=>void); onerror:null|((e:RecognitionErrorEvent)=>void); onend:null|(()=>void) }
type RecognitionCtor = new()=>Recognition;
declare global { interface Window { SpeechRecognition?:RecognitionCtor; webkitSpeechRecognition?:RecognitionCtor } }

export const speechSupported=()=>!!(window.SpeechRecognition||window.webkitSpeechRecognition);
export function shouldExecuteFinal(previous:{text:string;at:number},text:string,now=Date.now()){const execute=!!text&&(previous.text!==text||now-previous.at>=2000);return{execute,marker:execute?{text,at:now}:previous}}
export function chooseBestTranscript(alternatives:Array<{transcript:string;confidence?:number}>,cartProductNames:string[]=[]){return [...alternatives].sort((a,b)=>scoreTranscript(b.transcript,b.confidence??0,cartProductNames)-scoreTranscript(a.transcript,a.confidence??0,cartProductNames))[0]}
export function evaluateAlternatives(alternatives:Array<{transcript:string;confidence?:number}>,cartProductNames:string[]=[]){const ranked=[...alternatives].sort((a,b)=>scoreTranscript(b.transcript,b.confidence??0,cartProductNames)-scoreTranscript(a.transcript,a.confidence??0,cartProductNames)),best=ranked[0],parsed=parseCommand(best?.transcript??""),mutation=(p:ReturnType<typeof parseCommand>)=>["ADD_ITEM","REMOVE_QUANTITY","REMOVE_ALL","SET_QUANTITY"].includes(p.intent)?`${p.intent}:${p.normalizedItem}:${p.quantity}:${p.unit}`:"";const ambiguous=ranked.slice(1).some(a=>mutation(parseCommand(a.transcript))&&mutation(parseCommand(a.transcript))!==mutation(parsed)&&scoreTranscript(best.transcript,best.confidence??0,cartProductNames)-scoreTranscript(a.transcript,a.confidence??0,cartProductNames)<.2);return{best,confidence:ambiguous?.4:best?.confidence&&best.confidence>0?best.confidence:parsed.confidence}}
export function createRecognition(lang:string, handlers:{onState:(s:VoiceState)=>void;onTranscript:(text:string,final:boolean,confidence:number)=>void;onError:(message:string)=>void;cartProductNames?:string[]}):Recognition|null {
  const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition; if(!Ctor)return null;
  const recognition=new Ctor(); recognition.lang=lang; recognition.interimResults=true; recognition.continuous=false; recognition.maxAlternatives=5;
  recognition.onstart=()=>handlers.onState("listening");
  recognition.onresult=e=>{let text="",final=true,confidence=1;for(let i=0;i<e.results.length;i++){const result=e.results[i],choice=evaluateAlternatives(Array.from({length:result.length},(_,j)=>result[j]),handlers.cartProductNames);text+=`${choice.best?.transcript??""} `;confidence=Math.min(confidence,choice.confidence);final&&=result.isFinal}text=text.trim();if(text)handlers.onTranscript(text,final,confidence);if(final&&text)handlers.onState("processing")};
  recognition.onerror=e=>{ const messages:Record<string,string>={"not-allowed":"Microphone access was blocked. Enable it in browser settings or type your command below.","no-speech":"I didn’t hear anything. Try again or type your command.",network:"Speech recognition had a network error. Your text command still works.",aborted:"Listening was stopped."}; handlers.onState("error"); handlers.onError(messages[e.error]??`Speech recognition failed (${e.error}). Try the text command.`) };
  recognition.onend=()=>handlers.onState("idle"); return recognition;
}
