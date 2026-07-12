import { runtimeConfig } from "../config/runtime.ts";
import {
  litmoAgeRange,
  type AgeRangeResult,
  type AgeRangeStatus,
} from "litmo-age-range";
import { mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export type AgeEligibility = {
  status: AgeRangeStatus | "unverified";
  source: string | null;
  lowerBound: number | null;
  upperBound: number | null;
  recordedAt: string | null;
  isAdult: boolean;
};

export const ageGateService = {
  async isNativeAvailable(): Promise<boolean> {
    return litmoAgeRange.isAvailable();
  },

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

  /** Request Apple Declared Age Range (or unavailable). */
  async requestAppleAdultSignal(): Promise<AgeRangeResult> {
    return litmoAgeRange.requestAdultRange();
  },

  /**
   * Development-only self-attest when the native API is unavailable
   * (simulator / Expo Go / older iOS). Never offered in production builds.
   */
  async developmentSelfAttestAdult(): Promise<AgeEligibility> {
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
