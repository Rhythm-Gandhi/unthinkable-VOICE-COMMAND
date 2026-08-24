import { parseCommand, scoreTranscript } from "./domain";

export type VoiceState = "idle" | "requesting" | "listening" | "processing" | "success" | "error" | "unsupported";
type Alternative = { transcript:string; confidence:number };
type RecognitionResult = { [key:number]:Alternative; isFinal:boolean; length:number };
type RecognitionEvent = Event & { resultIndex:number; results:{ [key:number]:RecognitionResult; length:number } };
type RecognitionErrorEvent = Event & { error:string };
interface Recognition {
  lang:string; interimResults:boolean; continuous:boolean; maxAlternatives:number;
  start():void; stop():void; abort():void; cancelTimeout():void;
  onstart:null|(()=>void); onaudiostart:null|(()=>void); onsoundstart:null|(()=>void); onspeechstart:null|(()=>void);
  onresult:null|((e:RecognitionEvent)=>void); onerror:null|((e:RecognitionErrorEvent)=>void); onnomatch:null|(()=>void); onend:null|(()=>void);
}
type RecognitionCtor = new()=>Recognition;
declare global { interface Window { SpeechRecognition?:RecognitionCtor; webkitSpeechRecognition?:RecognitionCtor } }

const localeByLanguage:Record<string,string>={en:"en-IN",hi:"hi-IN",bn:"bn-IN",mr:"mr-IN",gu:"gu-IN",pa:"pa-IN",ta:"ta-IN",te:"te-IN",kn:"kn-IN",ml:"ml-IN",ur:"ur-IN"};
const canonicalLocale=(value:string)=>{try{return Intl.getCanonicalLocales(value)[0]}catch{return undefined}};

export const speechSupported=()=>!!(window.SpeechRecognition||window.webkitSpeechRecognition);
export function resolveRecognitionLocale(selected:string,browserLocale="en-IN"){
  const candidate=selected==="auto"?browserLocale:selected,canonical=canonicalLocale(candidate),base=canonical?.split("-")[0];
  if(!canonical||!base||!localeByLanguage[base])return "en-IN";
  return canonical.includes("-")?canonical:localeByLanguage[base];
}
export function shouldExecuteFinal(previous:{text:string;at:number},text:string,now=Date.now()){const execute=!!text&&(previous.text!==text||now-previous.at>=2000);return{execute,marker:execute?{text,at:now}:previous}}
export function recognitionEndMessage(heard:boolean,finalized:boolean,failed:boolean){return failed?undefined:!heard?"No speech was detected. Try again.":!finalized?"I heard part of that, but the browser did not finish the transcript. Please retry; nothing was executed.":undefined}
export function chooseBestTranscript(alternatives:Array<{transcript:string;confidence?:number}>,cartProductNames:string[]=[]){return [...alternatives].sort((a,b)=>scoreTranscript(b.transcript,b.confidence??0,cartProductNames)-scoreTranscript(a.transcript,a.confidence??0,cartProductNames))[0]}
export function evaluateAlternatives(alternatives:Array<{transcript:string;confidence?:number}>,cartProductNames:string[]=[]){const ranked=[...alternatives].sort((a,b)=>scoreTranscript(b.transcript,b.confidence??0,cartProductNames)-scoreTranscript(a.transcript,a.confidence??0,cartProductNames)),best=ranked[0],parsed=parseCommand(best?.transcript??""),mutation=(p:ReturnType<typeof parseCommand>)=>["ADD_ITEM","REMOVE_QUANTITY","REMOVE_ALL","SET_QUANTITY"].includes(p.intent)?`${p.intent}:${p.normalizedItem}:${p.quantity}:${p.unit}`:"";const ambiguous=ranked.slice(1).some(a=>mutation(parseCommand(a.transcript))&&mutation(parseCommand(a.transcript))!==mutation(parsed)&&scoreTranscript(best.transcript,best.confidence??0,cartProductNames)-scoreTranscript(a.transcript,a.confidence??0,cartProductNames)<.2);return{best,confidence:ambiguous?.4:best?.confidence&&best.confidence>0?best.confidence:parsed.confidence}}

export function createRecognition(lang:string,handlers:{onState:(s:VoiceState)=>void;onTranscript:(text:string,final:boolean,confidence:number)=>void;onError:(message:string)=>void;onActivity?:(kind:"audio"|"sound"|"speech")=>void;cartProductNames?:string[]},timeoutMs=15000):Recognition|null {
  const Ctor=window.SpeechRecognition||window.webkitSpeechRecognition;if(!Ctor)return null;
  const recognition=new Ctor();recognition.lang=lang;recognition.interimResults=true;recognition.continuous=false;recognition.maxAlternatives=5;
  let heard=false,finalized=false,failed=false,timer:ReturnType<typeof setTimeout>|undefined;
  const clearTimer=()=>{if(timer!==undefined){clearTimeout(timer);timer=undefined}};
  recognition.cancelTimeout=clearTimer;
  const armTimer=()=>{clearTimer();timer=setTimeout(()=>{failed=true;handlers.onState("error");handlers.onError("No speech was detected. Try again.");recognition.stop()},timeoutMs)};
  const activity=(kind:"audio"|"sound"|"speech")=>{armTimer();handlers.onActivity?.(kind)};
  recognition.onstart=()=>{handlers.onState("listening");armTimer()};
  recognition.onaudiostart=()=>activity("audio");
  recognition.onsoundstart=()=>activity("sound");
  recognition.onspeechstart=()=>activity("speech");
  recognition.onresult=e=>{clearTimer();let text="",final=true,confidence=1;for(let i=0;i<e.results.length;i++){const result=e.results[i],alternatives=Array.from({length:result.length},(_,j)=>result[j]),raw=alternatives[0]?.transcript?.trim()??"";try{const choice=evaluateAlternatives(alternatives,handlers.cartProductNames);text+=`${choice.best?.transcript?.trim()||raw} `;confidence=Math.min(confidence,choice.confidence)}catch{text+=`${raw} `}final&&=result.isFinal}text=text.trim();if(text){heard=true;finalized||=final;if(final)handlers.onState("processing");handlers.onTranscript(text,final,confidence)}else if(final){failed=true;handlers.onState("error");handlers.onError("No speech was detected. Try again.")}};
  recognition.onerror=e=>{clearTimer();failed=true;const messages:Record<string,string>={"not-allowed":"Microphone permission is blocked.","service-not-allowed":"Microphone permission is blocked.","audio-capture":"The microphone could not be accessed.","no-speech":"No speech was detected. Try again.",network:"The browser speech service is unavailable.",aborted:"Listening was stopped.","language-not-supported":"The selected recognition language is not supported."};handlers.onState("error");handlers.onError(messages[e.error]??`Speech recognition failed (${e.error}). Try again.`)};
  recognition.onnomatch=()=>{clearTimer();failed=true;handlers.onState("error");handlers.onError("No speech was detected. Try again.")};
  recognition.onend=()=>{clearTimer();const message=recognitionEndMessage(heard,finalized,failed);if(message)handlers.onError(message);handlers.onState("idle")};
  return recognition;
}
