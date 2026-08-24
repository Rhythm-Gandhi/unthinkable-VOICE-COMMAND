import { describe, expect, it } from "vitest";
import appSource from "./App.tsx?raw";

describe("Pantry removal and responsive reading order",()=>{
  it("removes Pantry UI and keeps the list before suggestions in the DOM",()=>{expect(appSource).not.toMatch(/PantryView|moveToPantry|\["pantry"/);const list=appSource.indexOf("<h2>Shopping list</h2>"),suggestions=appSource.indexOf("<Suggestions/>",list);expect(list).toBeGreaterThan(-1);expect(suggestions).toBeGreaterThan(list)});
  it("uses lazy local photographs with an accessible failure fallback",()=>{expect(appSource).toContain('loading="lazy"');expect(appSource).toContain('role="img"');expect(appSource).toContain('product photograph unavailable')});
});
