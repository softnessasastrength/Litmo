import {
  ConsentPreferenceSchema,
  TouchLanguageProfileSchema,
  UserProfileSchema,
  type ConsentPreference,
  type TouchLanguageProfile,
  type UserProfile,
} from "@litmo/domain";
import { PublicAppError, mapExternalError } from "./errors";
import { safeLog } from "./logger";
import { supabase } from "./supabase";
import { sensitiveDataService } from "./sensitiveDataService";

const TIMEOUT_MS = 10_000;
async function withTimeout<T>(operation: PromiseLike<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new PublicAppError(
                "request_timeout",
                "The request took too long. Try again.",
                true,
              ),
            ),
          TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}
function rowToProfile(row: Record<string, unknown>): UserProfile {
  return UserProfileSchema.parse({
    userId: row.user_id,
    displayName: row.display_name,
    pronouns: row.pronouns,
    bio: row.bio,
    vibeArchetype: row.vibe_archetype,
    onboardingCompletedAt: row.onboarding_completed_at,
  });
}

export const profileRepository = {
  async getProgress(
    userId: string,
  ): Promise<{ currentStep: string; draftProfile: Record<string, unknown> }> {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("onboarding_progress")
          .select("current_step,draft_profile")
          .eq("user_id", userId)
          .single(),
      );
      if (error) throw error;
      return {
        currentStep: data.current_step,
        draftProfile: data.draft_profile as Record<string, unknown>,
      };
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  async getOwnProfile(userId: string): Promise<UserProfile> {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("profiles")
          .select(
            "user_id,display_name,pronouns,bio,vibe_archetype,onboarding_completed_at",
          )
          .eq("user_id", userId)
          .single(),
      );
      if (error) throw error;
      return rowToProfile(data);
    } catch (error) {
      throw mapExternalError(error);
    }
  },
  async saveProgress(
    userId: string,
    currentStep: string,
    draftProfile: Record<string, unknown>,
  ) {
    try {
      const { error } = await withTimeout(
        supabase.from("onboarding_progress").upsert({
          user_id: userId,
          current_step: currentStep,
          draft_profile: draftProfile,
          updated_at: new Date().toISOString(),
        }),
      );
      if (error) throw error;
    } catch (error) {
      safeLog("onboarding_save_failed", {
        userId,
        errorCode: mapExternalError(error).code,
      });
      throw mapExternalError(error);
    }
  },
  async completeProfile(
    userId: string,
    profile: UserProfile,
    touchInput: unknown,
    consentInput: unknown,
  ) {
    const touch = TouchLanguageProfileSchema.parse(touchInput);
    const consent = ConsentPreferenceSchema.parse(consentInput);
    const touchPrivate = await sensitiveDataService.encryptText(
      touch.privateNervousSystemNotes,
      `profile:${userId}:touch-note`,
    );
    const consentPrivate = await sensitiveDataService.encryptText(
      consent.privateNervousSystemNotes,
      `profile:${userId}:consent-note`,
    );
    const publicProfile = UserProfileSchema.parse(profile);
    try {
      const { error: versionError } = await withTimeout(
        supabase.rpc("save_profile_versions", {
          touch_profile: touch,
          consent_preferences: consent,
          touch_private_notes: touchPrivate,
          consent_private_notes: consentPrivate,
        }),
      );
      if (versionError) throw versionError;
      const { error: profileError } = await withTimeout(
        supabase
          .from("profiles")
          .update({
            display_name: publicProfile.displayName,
            pronouns: publicProfile.pronouns,
            bio: publicProfile.bio,
            vibe_archetype: publicProfile.vibeArchetype,
            onboarding_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId),
      );
      if (profileError) throw profileError;
      await this.saveProgress(userId, "complete", {});
    } catch (error) {
      safeLog("profile_completion_failed", {
        userId,
        errorCode: mapExternalError(error).code,
      });
      throw mapExternalError(error);
    }
  },
  async updateGeneralProfile(
    userId: string,
    input: UserProfile,
  ): Promise<UserProfile> {
    const profile = UserProfileSchema.parse(input);
    try {
      const { data, error } = await withTimeout(
        supabase
          .from("profiles")
          .update({
            display_name: profile.displayName,
            pronouns: profile.pronouns,
            bio: profile.bio,
            vibe_archetype: profile.vibeArchetype,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .select(
            "user_id,display_name,pronouns,bio,vibe_archetype,onboarding_completed_at",
          )
          .single(),
      );
      if (error) throw error;
      return rowToProfile(data);
    } catch (error) {
      throw mapExternalError(error);
    }
  },
};
