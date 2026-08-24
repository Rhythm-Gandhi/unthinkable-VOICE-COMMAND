import { describe, expect, it } from "vitest";
import appSource from "./App.tsx?raw";

describe("Pantry removal and responsive reading order",()=>{
  it("removes Pantry UI and keeps the list before suggestions in the DOM",()=>{expect(appSource).not.toMatch(/PantryView|moveToPantry|\["pantry"/);const list=appSource.indexOf("<h2>Shopping list</h2>"),suggestions=appSource.indexOf("<Suggestions/>",list);expect(list).toBeGreaterThan(-1);expect(suggestions).toBeGreaterThan(list)});
  it("uses lazy local photographs with an accessible failure fallback",()=>{expect(appSource).toContain('loading="lazy"');expect(appSource).toContain('role="img"');expect(appSource).toContain('product photograph unavailable')});
  it("loads the expanded grocery photograph sheet without remote hotlinks",()=>{expect(appSource).toContain("grocery-sprite-nuts.webp");expect(appSource).toContain("product.photoSheet===1");expect(appSource).not.toMatch(/<img[^>]+src=["']https?:/)});
  it("uses the Piko product name without changing legacy storage keys",()=>{expect(appSource).toContain('aria-label="Piko home"');expect(appSource).not.toContain("VoiceCart");expect(appSource).toContain('const STORE="voice-cart-v1"')});
  it("starts a refresh-time spotlight tour and keeps its Next controls outside feature dialogs",()=>{expect(appSource).toContain('useState<"start"|"help"|"speech"|"download"|"theme"|"language"|null>("start")');expect(appSource).toContain('action="Start guide"');expect(appSource).toContain('title="Use these commands"');expect(appSource).toContain('title="Speak confirmations aloud"');expect(appSource).toContain('title="Download PNG"');expect(appSource).toContain('title="Light and dark mode"');expect(appSource).toContain('title="Choose your language"');expect(appSource).toContain("Add 50 grams of almonds");expect(appSource).toContain("Find toothpaste under Rs 100")});
});
