/**
 * Age gate service — adult eligibility signals for real accounts.
 *
 * WHAT: Read/write age_signal fields via Supabase and request Apple Declared Age Range.
 * WHY: Matching and real sessions require fail-closed adult status separate from onboarding self-report.
 * CONSENT: Age eligibility is not touch consent, Soft Signal, or trust certification.
 * EDGE CASES:
 *   - missing profile status → unverified / isAdult false
 *   - developmentSelfAttestAdult blocked in production builds
 * NEVER: Treat self-report onboarding age as production adult proof; skip gate after match.
 * SEE: app/app/onboarding/age-gate.tsx · litmo-age-range · AuthContext restore
 */

import { runtimeConfig } from "../config/runtime.ts";
import {
  litmoAgeRange,
  type AgeRangeResult,
  type AgeRangeStatus,
} from "litmo-age-range";
import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

/**
 * WHAT: Normalized adult-eligibility view for auth restore and age-gate UI.
 * WHY: Single shape so screens do not re-interpret raw profile columns.
 * CONSENT: isAdult true only means age signal adult — never session consent.
 * EDGE CASES: status null/missing → "unverified"; isAdult only when status === "adult".
 * NEVER: Infer isAdult from display name, match, or demo mode.
 */
export type AgeEligibility = {
  /** Product age-signal status including local "unverified" when DB null. */
  status: AgeRangeStatus | "unverified";
  source: string | null;
  lowerBound: number | null;
  upperBound: number | null;
  recordedAt: string | null;
  /** Fail-closed: true only for explicit adult status. */
  isAdult: boolean;
};

export const ageGateService = {
  /**
   * WHAT: Whether the native Declared Age Range / platform age API is available.
   * WHY: UI offers Apple path vs development-only attest based on capability.
   * CONSENT: Availability is not eligibility and not consent.
   * EDGE CASES: false on simulator / Expo Go / older iOS.
   * NEVER: Treat unavailable API as adult; force self-attest in production.
   * SEE: litmoAgeRange.isAvailable
   */
  async isNativeAvailable(): Promise<boolean> {
    return litmoAgeRange.isAvailable();
  },

  /**
   * WHAT: Load stored age signal for a user from profiles row.
   * WHY: Auth restore and age-gate need durable server signal, not only device cache.
   * CONSENT: Read-only; does not grant matching alone without auth state machine.
   * EDGE CASES:
   *   - null age_signal_status → unverified, isAdult false
   *   - query error → mapExternalError throw (caller fail-closes ageEligible)
   * NEVER: Default missing status to adult; log raw age bounds with PII in analytics.
   * SEE: profiles age_signal_* columns
   */
  async getEligibility(userId: string): Promise<AgeEligibility> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "age_signal_status,age_signal_source,age_signal_lower,age_signal_upper,age_signal_at",
        )
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      // Missing column → unverified; only explicit adult unlocks isAdult.
      const status =
        (data.age_signal_status as AgeRangeStatus | null) ?? "unverified";
      return {
        status: status === null ? "unverified" : status,
        source: (data.age_signal_source as string | null) ?? null,
        lowerBound: (data.age_signal_lower as number | null) ?? null,
        upperBound: (data.age_signal_upper as number | null) ?? null,
        recordedAt: (data.age_signal_at as string | null) ?? null,
        isAdult: status === "adult",
      };
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  /**
   * WHAT: Persist an AgeRangeResult via record_age_signal RPC and return eligibility view.
   * WHY: Apple (or dev) signal must land server-side before auth status advances.
   * CONSENT: Recording adult is eligibility only — still not Consent Snapshot confirm.
   * EDGE CASES: RPC error → throw; isAdult derived only from result.status === "adult".
   * NEVER: Accept client-forged adult without RPC policy; record peer’s signal as self.
   * SEE: record_age_signal RPC
   */
  async recordSignal(result: AgeRangeResult): Promise<AgeEligibility> {
    try {
      const { error } = await supabase.rpc("record_age_signal", {
        p_status: result.status,
        p_source: result.source,
        p_lower: result.lowerBound ?? null,
        p_upper: result.upperBound ?? null,
      });
      if (error) throw error;
      return {
        status: result.status,
        source: result.source,
        lowerBound: result.lowerBound ?? null,
        upperBound: result.upperBound ?? null,
        recordedAt: new Date().toISOString(),
        isAdult: result.status === "adult",
      };
    } catch (error) {
      throw mapExternalError(error);
    }
  },

  /**
   * WHAT: Request Apple Declared Age Range (or platform unavailable result).
   * WHY: Production adult signal path preferred over self-report.
   * CONSENT: Not touch consent; platform may return underage / unavailable.
   * EDGE CASES: unavailable → caller may show non-production attest only if allowed.
   * NEVER: Coerce unavailable into adult without explicit separate path.
   * SEE: litmoAgeRange.requestAdultRange
   */
  async requestAppleAdultSignal(): Promise<AgeRangeResult> {
    return litmoAgeRange.requestAdultRange();
  },

  /**
   * WHAT: Development-only self-attest adult when native API is unavailable.
   * WHY: Simulator / Expo Go / older iOS need a gated path for engineering tests.
   * CONSENT: Not production age proof; never offered in production builds.
   * EDGE CASES: runtimeConfig.isProduction → throw mapped error (fail closed).
   * NEVER: Call from production UI; treat source development_self_attest as App Store proof.
   * SEE: runtimeConfig.isProduction · age-gate screen
   */
  async developmentSelfAttestAdult(): Promise<AgeEligibility> {
    // Production builds must not accept local self-attest as adult signal.
    if (runtimeConfig.isProduction) {
      throw mapExternalError(
        new Error("development self-attest is not available in production"),
      );
    }
    return this.recordSignal({
      status: "adult",
      source: "development_self_attest",
    });
  },
};
