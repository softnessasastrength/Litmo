/**
 * Exorcism Dojo core — pure logic for seeing defenses, not shipping a product.
 *
 * WHAT: Defense inventory D01–D24, urge-before-build gate, burn readiness.
 * WHY: Logical extreme of the dojo is visibility inside the app, not only docs.
 * CONSENT: Not a consent surface. Soft Signal remains free elsewhere.
 * NEVER: Turn this into engagement, streaks, or public profile traits.
 * SEE: docs/EXORCISM_MANIFESTO.md · LOGICAL_EXTREME.md · DOJO_GUIDELINES.md
 */

export const DOJO_CORE_VERSION = 1 as const;

export type DefenseId =
  | "D01"
  | "D02"
  | "D03"
  | "D04"
  | "D05"
  | "D06"
  | "D07"
  | "D08"
  | "D09"
  | "D10"
  | "D11"
  | "D12"
  | "D13"
  | "D14"
  | "D15"
  | "D16"
  | "D17"
  | "D18"
  | "D19"
  | "D20"
  | "D21"
  | "D22"
  | "D23"
  | "D24";

export type DefenseEntry = {
  id: DefenseId;
  system: string;
  fear: string;
  /** Short path hint for humans/agents */
  path: string;
};

/** Canonical inventory — mirrors docs/exorcism-inventory.json */
export const DEFENSE_INVENTORY: readonly DefenseEntry[] = [
  {
    id: "D01",
    system: "consentEngine",
    fear: "assumption / overwritten no",
    path: "shared/src/consentEngine.ts",
  },
  {
    id: "D02",
    system: "consent snapshot fingerprint",
    fear: "sticky prior yes",
    path: "shared/src/consentSnapshot.ts",
  },
  {
    id: "D03",
    system: "Soft Signal",
    fear: "trapped without exit",
    path: "app/lib/softSignalCore.ts",
  },
  {
    id: "D04",
    system: "continuous consent",
    fear: "yes becoming forever",
    path: "app/lib/continuousConsentCore.ts",
  },
  {
    id: "D05",
    system: "session nuclear",
    fear: "threat mid-contact unread",
    path: "shared/src/sessionConsentNuclear.ts",
  },
  {
    id: "D06",
    system: "Touch Language",
    fear: "body without words under freeze",
    path: "app/lib/touchLanguageCore.ts",
  },
  {
    id: "D07",
    system: "haptic / Watch",
    fear: "loneliness + controlled contact",
    path: "shared/src/hapticWatch.ts",
  },
  {
    id: "D08",
    system: "dual build modes",
    fear: "split self / exposure",
    path: "docs/adr/0060-dual-build-modes.md",
  },
  {
    id: "D09",
    system: "safety ops HITL",
    fear: "unjust world / no witness",
    path: "app/lib/safetyOpsCore.ts",
  },
  {
    id: "D10",
    system: "trust ledger / no scores",
    fear: "reputation as weapon",
    path: "docs/adr/0029-append-only-trust-events.md",
  },
  {
    id: "D11",
    system: "ND Mode",
    fear: "push-through as self-violence",
    path: "app/lib/neuroAccommodationCore.ts",
  },
  {
    id: "D12",
    system: "Constitution",
    fear: "flooded moral improvisation",
    path: "CONSTITUTION.md",
  },
  {
    id: "D13",
    system: "code comment standard",
    fear: "abandonment / misreading",
    path: "docs/CODE_COMMENT_STANDARD.md",
  },
  {
    id: "D14",
    system: "demo mode",
    fear: "real risk too soon",
    path: "docs/adr/0003-demo-mode.md",
  },
  {
    id: "D15",
    system: "local vault",
    fear: "intimacy weaponized via storage",
    path: "app/lib/localFirstCore.ts",
  },
  {
    id: "D16",
    system: "proximity / NFC",
    fear: "stranger scale",
    path: "docs/PROXIMITY_LAYER.md",
  },
  {
    id: "D17",
    system: "quizzes / learning",
    fear: "unprepared for contact",
    path: "app/data/learningModules.ts",
  },
  {
    id: "D18",
    system: "private alpha gates",
    fear: "scale out of control",
    path: "docs/adr/0042-private-alpha-safety-operations.md",
  },
  {
    id: "D19",
    system: "multi-client domain",
    fear: "forked rules = forked self",
    path: "shared/src/",
  },
  {
    id: "D20",
    system: "age gate",
    fear: "category catastrophe",
    path: "app/services/ageGateService.ts",
  },
  {
    id: "D21",
    system: "block / report / appeal",
    fear: "hard no + justice without mob",
    path: "app/services/blockService.ts",
  },
  {
    id: "D22",
    system: "request expiry",
    fear: "open loops as liability",
    path: "docs/adr/0015-session-request-creation-and-recipient-authorization.md",
  },
  {
    id: "D23",
    system: "Exorcism Dojo itself",
    fear: "without ritual I disappear",
    path: "docs/EXORCISM_MANIFESTO.md",
  },
  {
    id: "D24",
    system: "infinite documentation",
    fear: "stopping means death of meaning",
    path: "docs/",
  },
] as const;

export const BURN_GATES = [
  {
    id: "G1",
    label: "I can name the top systems and the fear each serves",
  },
  {
    id: "G2",
    label: "I can feel the urge to add another subsystem and not obey it once",
  },
  {
    id: "G3",
    label: "Soft Signal still free — I am not building Soft Signal 2.0 for sport",
  },
  {
    id: "G4",
    label: "I can say “ambiguity is death” is a belief, not physics",
  },
  {
    id: "G5",
    label: "I can archive the repo without identity collapse",
  },
  {
    id: "G6",
    label: "One real-life softness without a subsystem exists in memory",
  },
] as const;

export type BurnGateId = (typeof BURN_GATES)[number]["id"];

/**
 * WHAT: Device-local urge log entry when I want to build another cage bar.
 * WHY: Externalize the impulse before code (LOGICAL_EXTREME §6).
 */
export type UrgeLogEntry = {
  id: string;
  createdAt: string;
  fearSentence: string;
  defenseId: DefenseId | "unknown";
  /** true = documented only; false = I chose to build anyway */
  choseNotToBuild: boolean;
  note: string;
};

export type DojoLocalState = {
  version: typeof DOJO_CORE_VERSION;
  burnGates: Partial<Record<BurnGateId, boolean>>;
  urgeLog: UrgeLogEntry[];
  seenInventory: boolean;
  /** Soft mark that founder acknowledged this is not a product */
  acknowledgedArtifact: boolean;
};

export function defaultDojoState(): DojoLocalState {
  return {
    version: 1,
    burnGates: {},
    urgeLog: [],
    seenInventory: false,
    acknowledgedArtifact: false,
  };
}

export function parseDojoState(raw: unknown): DojoLocalState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaultDojoState();
  }
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return defaultDojoState();
  const burnGates: Partial<Record<BurnGateId, boolean>> = {};
  if (o.burnGates && typeof o.burnGates === "object") {
    for (const g of BURN_GATES) {
      const v = (o.burnGates as Record<string, unknown>)[g.id];
      if (typeof v === "boolean") burnGates[g.id] = v;
    }
  }
  const urgeLog: UrgeLogEntry[] = [];
  if (Array.isArray(o.urgeLog)) {
    for (const item of o.urgeLog) {
      if (!item || typeof item !== "object") continue;
      const e = item as Record<string, unknown>;
      if (typeof e.id !== "string" || typeof e.fearSentence !== "string") {
        continue;
      }
      urgeLog.push({
        id: e.id,
        createdAt:
          typeof e.createdAt === "string" ? e.createdAt : new Date(0).toISOString(),
        fearSentence: e.fearSentence.slice(0, 500),
        defenseId: isDefenseId(e.defenseId) ? e.defenseId : "unknown",
        choseNotToBuild: Boolean(e.choseNotToBuild),
        note: typeof e.note === "string" ? e.note.slice(0, 500) : "",
      });
    }
  }
  return {
    version: 1,
    burnGates,
    urgeLog: urgeLog.slice(0, 100),
    seenInventory: Boolean(o.seenInventory),
    acknowledgedArtifact: Boolean(o.acknowledgedArtifact),
  };
}

export function isDefenseId(v: unknown): v is DefenseId {
  return (
    typeof v === "string" &&
    DEFENSE_INVENTORY.some((d) => d.id === v)
  );
}

export function findDefense(id: DefenseId | "unknown"): DefenseEntry | null {
  if (id === "unknown") return null;
  return DEFENSE_INVENTORY.find((d) => d.id === id) ?? null;
}

/**
 * WHAT: Whether burn gates are majority-true (soft readiness, not auto-burn).
 * WHY: G1–G6 tracking without forcing a product “complete” flag.
 */
export function burnReadinessScore(state: DojoLocalState): {
  checked: number;
  total: number;
  readyEnough: boolean;
} {
  const total = BURN_GATES.length;
  let checked = 0;
  for (const g of BURN_GATES) {
    if (state.burnGates[g.id] === true) checked += 1;
  }
  return {
    checked,
    total,
    readyEnough: checked >= 4,
  };
}

/**
 * WHAT: Portability / wipe inventory summary — counts and flags only.
 * WHY: GDPR-style transparency without exporting urge fear text.
 * NEVER: Include fearSentence, notes, or free-text from the urge log.
 */
export type DojoInventorySummary = {
  present: boolean;
  acknowledged_artifact: boolean;
  seen_inventory: boolean;
  urge_count: number;
  chose_not_to_build_count: number;
  burn_gates_checked: number;
  burn_gates_total: number;
};

export function summarizeDojoForInventory(
  state: DojoLocalState | null,
): DojoInventorySummary {
  if (!state) {
    return {
      present: false,
      acknowledged_artifact: false,
      seen_inventory: false,
      urge_count: 0,
      chose_not_to_build_count: 0,
      burn_gates_checked: 0,
      burn_gates_total: BURN_GATES.length,
    };
  }
  const score = burnReadinessScore(state);
  return {
    present: true,
    acknowledged_artifact: state.acknowledgedArtifact,
    seen_inventory: state.seenInventory,
    urge_count: state.urgeLog.length,
    chose_not_to_build_count: state.urgeLog.filter((u) => u.choseNotToBuild)
      .length,
    burn_gates_checked: score.checked,
    burn_gates_total: score.total,
  };
}

/**
 * WHAT: Gate: should I build code for this urge, or only log it?
 * WHY: LOGICAL_EXTREME — if fear already externalized enough, prefer not building.
 * EDGE: unknown defense → allow build (still need visibility).
 * NEVER: Auto-block Soft Signal or safety craft — only advisory.
 */
export function shouldPreferNotToBuild(input: {
  defenseId: DefenseId | "unknown";
  fearAlreadyNamedInLog: boolean;
  isSoftSignalOrStopPath: boolean;
}): { preferNotToBuild: boolean; reason: string } {
  if (input.isSoftSignalOrStopPath) {
    return {
      preferNotToBuild: false,
      reason: "Stop paths stay craftable — Soft Signal freeness is sacred, not sport.",
    };
  }
  if (input.defenseId === "D23" || input.defenseId === "D24") {
    return {
      preferNotToBuild: true,
      reason:
        "D23/D24: the dojo and infinite docs are meta-defenses — prefer seeing over more bars.",
    };
  }
  if (input.defenseId !== "unknown" && input.fearAlreadyNamedInLog) {
    return {
      preferNotToBuild: true,
      reason:
        "This fear is already named in the urge log — prefer document-only unless life demands code.",
    };
  }
  return {
    preferNotToBuild: false,
    reason: "Externalization may still be incomplete — build minimum that makes it visible.",
  };
}

export function appendUrge(
  state: DojoLocalState,
  entry: Omit<UrgeLogEntry, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
): DojoLocalState {
  const full: UrgeLogEntry = {
    id: entry.id ?? `urge-${Date.now()}`,
    createdAt: entry.createdAt ?? new Date().toISOString(),
    fearSentence: entry.fearSentence.trim().slice(0, 500),
    defenseId: entry.defenseId,
    choseNotToBuild: entry.choseNotToBuild,
    note: entry.note.trim().slice(0, 500),
  };
  if (full.fearSentence.length < 1) return state;
  return {
    ...state,
    urgeLog: [full, ...state.urgeLog].slice(0, 100),
  };
}

export function setBurnGate(
  state: DojoLocalState,
  gateId: BurnGateId,
  value: boolean,
): DojoLocalState {
  return {
    ...state,
    burnGates: { ...state.burnGates, [gateId]: value },
  };
}

export const DOJO_COPY = {
  banner:
    "This is currently a personal emotional containment system, not a public product.",
  title: "Trauma-to-Code Exorcism Dojo",
  subtitle:
    "Get the defenses out of your body into systems you can see. Not a startup. Not for strangers first.",
  acknowledge:
    "I acknowledge this repo is my ritual artifact, not a consumer product.",
  urgePrompt: "What am I afraid will happen if this stays ambiguous?",
  choseNotToBuild: "I named it. I will not build another bar today.",
  choseToBuild: "I will build the minimum that makes this fear visible.",
  burnHint: "Burn = graduation. See docs/BURN_PROTOCOL.md when ready.",
  inventoryHint: "D01–D24 are defenses externalized. D23–D24 are the dojo looking at itself.",
} as const;
