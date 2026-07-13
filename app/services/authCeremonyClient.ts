/**
 * Client for the auth-ceremony Edge Function.
 * Rate limits + audit only; WebAuthn verification stays in Supabase Auth.
 */

import { Platform } from "react-native";
import { PublicAppError, mapExternalError } from "./errors.ts";
import { supabase } from "./supabase.ts";

export type CeremonyKind =
  | "register"
  | "authenticate"
  | "otp_request"
  | "device_register";

export type CeremonyPhase = "start" | "complete";

export type CeremonyOutcome =
  | "succeeded"
  | "failed"
  | "cancelled"
  | "started"
  | "rate_limited";

type GateResult = {
  ok: boolean;
  allowed: boolean;
  auditId?: number | null;
  message?: string;
};

/**
 * Notify Edge of a ceremony start/complete. Fail-open only when the function
 * is undeployed (local without `supabase functions serve`); fail-closed on
 * explicit rate limits.
 */
export async function gateAuthCeremony(input: {
  phase: CeremonyPhase;
  ceremony: CeremonyKind;
  outcome?: CeremonyOutcome;
  deviceId?: string | null;
  errorCode?: string | null;
}): Promise<GateResult> {
  try {
    const { data, error } = await supabase.functions.invoke("auth-ceremony", {
      body: {
        phase: input.phase,
        ceremony: input.ceremony,
        outcome: input.outcome,
        deviceId: input.deviceId ?? undefined,
        platform: Platform.OS,
        errorCode: input.errorCode ?? undefined,
      },
    });

    if (error) {
      // Functions not deployed / network — allow ceremony but surface soft log.
      const message = String(error.message ?? error).toLowerCase();
      if (
        message.includes("failed to send") ||
        message.includes("fetch") ||
        message.includes("not found") ||
        message.includes("404")
      ) {
        return { ok: true, allowed: true, message: "edge_unavailable" };
      }
      // 429 from edge often arrives as FunctionsHttpError
      if (message.includes("429") || message.includes("rate")) {
        throw new PublicAppError(
          "auth_rate_limited",
          "You're doing that too often — try again later.",
          true,
        );
      }
      throw mapExternalError(error);
    }

    const payload = (data ?? {}) as {
      ok?: boolean;
      allowed?: boolean;
      error?: string;
      message?: string;
      auditId?: number;
    };

    const denied =
      payload.error === "rate_limited" || payload.allowed === false;
    if (denied) {
      throw new PublicAppError(
        "auth_rate_limited",
        payload.message ??
          "You're doing that too often — try again later.",
        true,
      );
    }

    return {
      ok: payload.ok !== false,
      allowed: true,
      auditId: payload.auditId ?? null,
    };
  } catch (error) {
    if (error instanceof PublicAppError) throw error;
    // Unexpected — do not block passkey if edge is misbehaving offline.
    return { ok: true, allowed: true, message: "edge_soft_fail" };
  }
}
