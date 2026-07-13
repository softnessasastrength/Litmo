import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import {
  parseDeclaration,
  parseMutualSnapshot,
  type MutualConsentSnapshot,
  type PreSessionDeclaration,
} from "../lib/sessionConsentSnapshotCore.ts";

const DECL_SECURE = "litmo.consent_snapshot.declaration.secure.v1";
const DECL_ASYNC = "litmo.consent_snapshot.declaration.v1";
const MUTUAL_SECURE = "litmo.consent_snapshot.mutual.secure.v1";
const MUTUAL_ASYNC = "litmo.consent_snapshot.mutual.v1";

async function read(secureKey: string, asyncKey: string): Promise<string | null> {
  try {
    const s = await SecureStore.getItemAsync(secureKey);
    if (s != null) return s;
  } catch {
    // fallback
  }
  return AsyncStorage.getItem(asyncKey);
}

async function write(
  secureKey: string,
  asyncKey: string,
  value: string,
): Promise<void> {
  let ok = false;
  try {
    await SecureStore.setItemAsync(secureKey, value);
    ok = true;
  } catch {
    ok = false;
  }
  if (ok) {
    await AsyncStorage.removeItem(asyncKey);
    return;
  }
  await AsyncStorage.setItem(asyncKey, value);
}

export const sessionConsentSnapshotStore = {
  async loadDeclaration(): Promise<PreSessionDeclaration | null> {
    const raw = await read(DECL_SECURE, DECL_ASYNC);
    if (!raw) return null;
    try {
      return parseDeclaration(JSON.parse(raw));
    } catch {
      return null;
    }
  },

  async saveDeclaration(
    decl: PreSessionDeclaration,
  ): Promise<PreSessionDeclaration> {
    const parsed = parseDeclaration({
      ...decl,
      updatedAt: new Date().toISOString(),
      notConsentAlone: true,
      forThisMomentOnly: true,
      version: 1,
    });
    if (!parsed) throw new Error("declaration_invalid");
    await write(DECL_SECURE, DECL_ASYNC, JSON.stringify(parsed));
    return parsed;
  },

  async loadMutual(): Promise<MutualConsentSnapshot | null> {
    const raw = await read(MUTUAL_SECURE, MUTUAL_ASYNC);
    if (!raw) return null;
    try {
      return parseMutualSnapshot(JSON.parse(raw));
    } catch {
      return null;
    }
  },

  async saveMutual(
    snap: MutualConsentSnapshot,
  ): Promise<MutualConsentSnapshot> {
    const parsed = parseMutualSnapshot(snap);
    if (!parsed) throw new Error("mutual_snapshot_invalid");
    await write(MUTUAL_SECURE, MUTUAL_ASYNC, JSON.stringify(parsed));
    return parsed;
  },

  async clearMutual(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(MUTUAL_SECURE);
    } catch {
      // ignore
    }
    await AsyncStorage.removeItem(MUTUAL_ASYNC);
  },
};
