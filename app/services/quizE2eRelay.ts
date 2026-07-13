/**
 * Optional Supabase ciphertext-only relay for partner quiz E2E packages.
 *
 * Server stores opaque blobs only — never private keys, seal keys, or plaintext
 * weather. Failures never invent packages. Out-of-band paste remains the primary path.
 */

import { environmentError, supabase } from "./supabase.ts";
import { safeLog } from "./logger.ts";
import { parseE2ePackage } from "./quizE2eSession.ts";

const TIMEOUT_MS = 10_000;

async function withTimeout<T>(operation: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("request_timeout")),
          TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

function assertOpaquePackage(packageJson: string): { error: string } | null {
  const parsed = parseE2ePackage(packageJson);
  if ("error" in parsed) return parsed;
  // Refuse anything that looks like a legacy seal-key package
  if (/sealKey/i.test(packageJson)) {
    return {
      error: "Refusing to relay a package that appears to contain a seal key.",
    };
  }
  if (
    /"privateKey"|dhsPrivate|chainKeySend|rootKey/.test(packageJson)
  ) {
    return {
      error: "Refusing to relay a package that appears to contain private keys.",
    };
  }
  return null;
}

export const quizE2eRelay = {
  /**
   * Publish an opaque E2E package. Requires authenticated session when Supabase
   * is configured; returns a short claim code for the partner.
   */
  async publish(
    invitePublicId: string,
    packageJson: string,
  ): Promise<{ claimCode: string } | { error: string; offline?: boolean }> {
    if (environmentError) {
      return {
        error: "Relay unavailable offline. Copy the package out-of-band instead.",
        offline: true,
      };
    }
    const bad = assertOpaquePackage(packageJson);
    if (bad) return bad;

    try {
      const { data: sessionData, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
      );
      if (sessionError || !sessionData.session?.user) {
        return {
          error:
            "Sign in to use the optional encrypted relay, or copy the package yourself.",
          offline: true,
        };
      }

      const { data, error } = await withTimeout(
        supabase.rpc("publish_quiz_e2e_relay", {
          p_invite_public_id: invitePublicId,
          p_ciphertext: packageJson,
        }),
      );
      if (error) throw error;
      const claimCode = typeof data === "string" ? data : (data as { claim_code?: string })?.claim_code;
      if (!claimCode || typeof claimCode !== "string") {
        return { error: "Relay did not return a claim code. Fail closed." };
      }
      return { claimCode };
    } catch (err) {
      safeLog("quiz_e2e_relay_publish_failed", {
        message: err instanceof Error ? err.message : "unknown",
      });
      return {
        error:
          "Could not publish encrypted package. Copy it out-of-band instead.",
      };
    }
  },

  /**
   * Fetch an opaque package by claim code. Caller must decrypt locally.
   */
  async claim(
    claimCode: string,
  ): Promise<{ packageJson: string; invitePublicId: string } | { error: string; offline?: boolean }> {
    if (environmentError) {
      return {
        error: "Relay unavailable offline. Paste the package instead.",
        offline: true,
      };
    }
    const code = claimCode.trim();
    if (code.length < 8 || code.length > 64) {
      return { error: "Claim code looks invalid. Fail closed." };
    }
    try {
      const { data, error } = await withTimeout(
        supabase.rpc("claim_quiz_e2e_relay", {
          p_claim_code: code,
        }),
      );
      if (error) throw error;
      const row = data as {
        invite_public_id?: string;
        ciphertext?: string;
      } | null;
      if (!row?.ciphertext || !row.invite_public_id) {
        return { error: "No package found for that code, or it expired." };
      }
      const bad = assertOpaquePackage(row.ciphertext);
      if (bad) return bad;
      return {
        packageJson: row.ciphertext,
        invitePublicId: row.invite_public_id,
      };
    } catch (err) {
      safeLog("quiz_e2e_relay_claim_failed", {
        message: err instanceof Error ? err.message : "unknown",
      });
      return {
        error: "Could not claim package. Try pasting it instead.",
      };
    }
  },
};
