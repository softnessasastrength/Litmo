import {
  createDefaultTouchLanguage,
  parseTouchLanguageDocument,
  type TouchLanguageDocument,
} from "../lib/touchLanguageCore.ts";
import { localVault } from "./localVault.ts";
import { localFirstCoordinator } from "./localFirstCoordinator.ts";

/** Device-local Touch Language persistence (local vault — offline first). */
export const touchLanguageStore = {
  async load(): Promise<TouchLanguageDocument | null> {
    const raw = await localVault.getJson<unknown>("touch_language");
    if (!raw) return null;
    return parseTouchLanguageDocument(raw);
  },

  async save(doc: TouchLanguageDocument): Promise<TouchLanguageDocument> {
    const parsed = parseTouchLanguageDocument({
      ...doc,
      updatedAt: new Date().toISOString(),
      notConsentToTouch: true,
      shareIsReviewOnly: true,
      version: 1,
    });
    if (!parsed) {
      throw new Error("Touch Language document failed validation.");
    }
    await localVault.setJson("touch_language", parsed);
    void localFirstCoordinator.afterLocalWrite("touch_language");
    return parsed;
  },

  async loadOrDefault(): Promise<TouchLanguageDocument> {
    return (await this.load()) ?? createDefaultTouchLanguage();
  },

  async clear(): Promise<void> {
    await localVault.remove("touch_language");
  },
};
