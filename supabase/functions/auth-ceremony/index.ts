/**
 * Litmo auth-ceremony Edge Function
 *
 * Supplements Supabase Auth WebAuthn with:
 * - rate limiting (pre-auth subject hash + authenticated user hash)
 * - non-sensitive audit logging
 * - device-binding notifications after success
 *
 * Does NOT verify WebAuthn credentials (Supabase Auth does that).
 * Does NOT log secrets, challenges, OTPs, biometrics, or consent content.
 *
 * POST JSON:
 * {
 *   phase: "start" | "complete",
 *   ceremony: "register" | "authenticate" | "otp_request" | "device_register",
 *   outcome?: "succeeded" | "failed" | "cancelled",
 *   deviceId?: string (uuid),
 *   platform?: string,
 *   errorCode?: string
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-litmo-device-id",
};

type Ceremony =
  | "register"
  | "authenticate"
  | "otp_request"
  | "device_register";
type Phase = "start" | "complete";
type Outcome = "succeeded" | "failed" | "cancelled" | "started" | "rate_limited";

type Body = {
  phase?: Phase;
  ceremony?: Ceremony;
  outcome?: Outcome;
  deviceId?: string;
  platform?: string;
  errorCode?: string;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function mapRateAction(ceremony: Ceremony, phase: Phase): string {
  if (ceremony === "otp_request") return "otp_request";
  if (ceremony === "device_register") return "device_register";
  if (ceremony === "register" && phase === "start") {
    return "passkey_register_start";
  }
  if (ceremony === "register" && phase === "complete") {
    return "passkey_register_complete";
  }
  if (ceremony === "authenticate" && phase === "start") {
    return "passkey_auth_start";
  }
  return "passkey_auth_complete";
}

function mapEventType(
  ceremony: Ceremony,
  phase: Phase,
  outcome: Outcome,
): string {
  if (outcome === "rate_limited") return "rate_limited";
  if (outcome === "cancelled") return "passkey_cancelled";
  if (outcome === "failed") return "passkey_failed";
  if (ceremony === "otp_request") return "otp_request";
  if (ceremony === "device_register") return "device_register";
  if (ceremony === "register" && phase === "start") {
    return "passkey_register_start";
  }
  if (ceremony === "register") return "passkey_register_complete";
  if (phase === "start") return "passkey_auth_start";
  return "passkey_auth_complete";
}

function mapOutcome(phase: Phase, outcome?: Outcome): Outcome {
  if (outcome) return outcome;
  return phase === "start" ? "started" : "succeeded";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return json(500, { ok: false, error: "misconfigured" });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json(400, { ok: false, error: "invalid_json" });
  }

  const phase = body.phase;
  const ceremony = body.ceremony;
  if (
    (phase !== "start" && phase !== "complete") ||
    (ceremony !== "register" &&
      ceremony !== "authenticate" &&
      ceremony !== "otp_request" &&
      ceremony !== "device_register")
  ) {
    return json(400, { ok: false, error: "invalid_ceremony" });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const admin = createClient(supabaseUrl, serviceKey);

  let userId: string | null = null;
  if (authHeader.startsWith("Bearer ")) {
    const { data } = await userClient.auth.getUser();
    userId = data.user?.id ?? null;
  }

  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const ua = (req.headers.get("user-agent") ?? "unknown").slice(0, 120);
  const subjectSeed = userId
    ? `user:${userId}`
    : `ip:${ip}|ua:${ua}|c:${ceremony}`;
  const subjectHash = await sha256Hex(subjectSeed);

  const rateAction = mapRateAction(ceremony, phase);
  const { error: rateError } = await admin.rpc(
    "assert_auth_ceremony_rate_limit",
    {
      p_subject_hash: subjectHash,
      p_action: rateAction,
    },
  );

  if (rateError) {
    await admin.rpc("log_auth_audit_event", {
      p_user_id: userId,
      p_device_id: body.deviceId ?? null,
      p_event_type: "rate_limited",
      p_outcome: "rate_limited",
      p_metadata: {
        ceremony,
        phase,
        action: rateAction,
        platform: body.platform ?? null,
      },
    });
    return json(429, {
      ok: false,
      error: "rate_limited",
      message: "You're doing that too often — try again later.",
    });
  }

  const outcome = mapOutcome(phase, body.outcome);
  const eventType = mapEventType(ceremony, phase, outcome);

  const { data: auditId, error: auditError } = await admin.rpc(
    "log_auth_audit_event",
    {
      p_user_id: userId,
      p_device_id: body.deviceId ?? null,
      p_event_type: eventType,
      p_outcome: outcome,
      p_metadata: {
        ceremony,
        phase,
        platform: body.platform ?? null,
        errorCode: body.errorCode ? String(body.errorCode).slice(0, 80) : null,
      },
    },
  );

  if (auditError) {
    // Rate limit already consumed; do not fail the client ceremony for audit hiccups.
    console.error("auth_audit_failed", auditError.message);
  }

  return json(200, {
    ok: true,
    allowed: true,
    auditId: auditId ?? null,
    // Reminder for clients — not enforcement of WebAuthn.
    policy: {
      primaryMethod: "passkey_webauthn",
      deviceBindingRequiredForConsent: true,
      neverLogsSecrets: true,
    },
  });
});
