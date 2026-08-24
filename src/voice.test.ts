import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRecognition, resolveRecognitionLocale } from "./voice";

class FakeRecognition {
  static latest:FakeRecognition;
  lang="";interimResults=false;continuous=false;maxAlternatives=1;
  start=vi.fn();stop=vi.fn();abort=vi.fn();
  onstart:null|(()=>void)=null;onaudiostart:null|(()=>void)=null;onsoundstart:null|(()=>void)=null;onspeechstart:null|(()=>void)=null;
  onresult:null|((event:never)=>void)=null;onerror:null|((event:never)=>void)=null;onnomatch:null|(()=>void)=null;onend:null|(()=>void)=null;
  constructor(){FakeRecognition.latest=this}
}

describe("speech recognition lifecycle",()=>{
  beforeEach(()=>{vi.useFakeTimers();Object.defineProperty(globalThis,"window",{configurable:true,value:{SpeechRecognition:FakeRecognition}})});
  afterEach(()=>{vi.useRealTimers();Reflect.deleteProperty(globalThis,"window")});

  it("resolves auto and manual selections to supported BCP-47 locales",()=>{
    expect(resolveRecognitionLocale("auto","en-US")).toBe("en-US");
    expect(resolveRecognitionLocale("auto","hi")).toBe("hi-IN");
    expect(resolveRecognitionLocale("auto","not a locale")).toBe("en-IN");
    expect(resolveRecognitionLocale("ta-IN","en-US")).toBe("ta-IN");
  });

  it("starts its timeout only after the browser starts listening",()=>{
    const errors:string[]=[];
    createRecognition("en-IN",{onState:vi.fn(),onTranscript:vi.fn(),onError:text=>errors.push(text)},20);
    vi.advanceTimersByTime(30);expect(FakeRecognition.latest.stop).not.toHaveBeenCalled();
    FakeRecognition.latest.onstart?.();vi.advanceTimersByTime(20);
    expect(FakeRecognition.latest.stop).toHaveBeenCalledOnce();expect(errors[0]).toBe("No speech was detected. Try again.");
  });

  it("resets the timeout when microphone activity begins",()=>{
    createRecognition("en-IN",{onState:vi.fn(),onTranscript:vi.fn(),onError:vi.fn()},20);
    FakeRecognition.latest.onstart?.();vi.advanceTimersByTime(15);FakeRecognition.latest.onaudiostart?.();vi.advanceTimersByTime(15);
    expect(FakeRecognition.latest.stop).not.toHaveBeenCalled();vi.advanceTimersByTime(5);expect(FakeRecognition.latest.stop).toHaveBeenCalledOnce();
  });

  it("cancels an old session timeout before a new session",()=>{
    const recognition=createRecognition("en-IN",{onState:vi.fn(),onTranscript:vi.fn(),onError:vi.fn()},20)!;
    FakeRecognition.latest.onstart?.();recognition.cancelTimeout();vi.advanceTimersByTime(25);
    expect(FakeRecognition.latest.stop).not.toHaveBeenCalled();
  });

  it("shows interim text but only marks finalized recognition as processing",()=>{
    const transcripts:Array<[string,boolean]>=[],states:string[]=[];
    createRecognition("en-IN",{onState:s=>states.push(s),onTranscript:(text,final)=>transcripts.push([text,final]),onError:vi.fn()});
    FakeRecognition.latest.onstart?.();
    FakeRecognition.latest.onresult?.({resultIndex:0,results:{0:{0:{transcript:"add milk",confidence:.9},isFinal:false,length:1},length:1}} as never);
    FakeRecognition.latest.onresult?.({resultIndex:0,results:{0:{0:{transcript:"add milk",confidence:.9},isFinal:true,length:1},length:1}} as never);
    expect(transcripts).toEqual([["add milk",false],["add milk",true]]);expect(states).toContain("processing");
  });

  it("reports an empty final result at the result boundary",()=>{
    const errors:string[]=[];
    createRecognition("en-IN",{onState:vi.fn(),onTranscript:vi.fn(),onError:text=>errors.push(text)});
    FakeRecognition.latest.onresult?.({resultIndex:0,results:{0:{0:{transcript:"",confidence:0},isFinal:true,length:1},length:1}} as never);
    expect(errors).toEqual(["No speech was detected. Try again."]);
  });
});
