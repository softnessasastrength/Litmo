import { PublicAppError, mapExternalError } from "./errors.ts";

type DeviceIdentity = { id: string; secret: string };
export type RegisteredDevice = {
  id: string;
  display_name: string;
  registered_at: string;
  last_seen_at: string;
  revoked_at: string | null;
};
type Dependencies = {
  storage: {
    get(): Promise<string | null>;
    set(value: string): Promise<void>;
    clear(): Promise<void>;
  };
  client: {
    rpc(
      name: string,
      input: Record<string, unknown>,
    ): Promise<{
      data: unknown;
      error: unknown;
    }>;
    from(name: string): {
      select(columns: string): {
        order(
          column: string,
          options: { ascending: boolean },
        ): Promise<{
          data: RegisteredDevice[];
          error: unknown;
        }>;
      };
    };
    auth: { signOut(): Promise<{ error: unknown }> };
  };
  randomUUID(): string;
  platform: string;
};

export function createDeviceRegistrationService({
  storage,
  client,
  randomUUID,
  platform,
}: Dependencies) {
  const makeSecret = () => `${randomUUID()}${randomUUID()}`;
  const localIdentity = async (): Promise<DeviceIdentity | null> => {
    const stored = await storage.get();
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as Partial<DeviceIdentity>;
      return parsed.id && parsed.secret
        ? { id: parsed.id, secret: parsed.secret }
        : null;
    } catch {
      await storage.clear();
      return null;
    }
  };

  return {
    async register() {
      const identity = (await localIdentity()) ?? {
        id: randomUUID(),
        secret: makeSecret(),
      };
      const { error } = await client.rpc("register_auth_device", {
        p_id: identity.id,
        p_secret: identity.secret,
        p_display_name: `${platform === "ios" ? "Apple" : "Mobile"} device`,
      });
      if (error) throw mapExternalError(error);
      await storage.set(JSON.stringify(identity));
      return identity.id;
    },
    async verify() {
      const identity = await localIdentity();
      if (!identity)
        throw new PublicAppError(
          "auth_revoked",
          "This restored or changed device must sign in with a passkey again.",
        );
      const { data, error } = await client.rpc("verify_auth_device", {
        p_id: identity.id,
        p_secret: identity.secret,
      });
      if (error) throw mapExternalError(error);
      if (!data)
        throw new PublicAppError(
          "auth_revoked",
          "This device registration was revoked. Sign in with a passkey to register it again.",
        );
      return identity.id;
    },
    async list() {
      const { data, error } = await client
        .from("auth_devices")
        .select("id,display_name,registered_at,last_seen_at,revoked_at")
        .order("last_seen_at", { ascending: false });
      if (error) throw mapExternalError(error);
      return data;
    },
    async revoke(targetId: string) {
      const identity = await localIdentity();
      if (!identity)
        throw new PublicAppError(
          "auth_revoked",
          "This device is no longer trusted.",
        );
      const { error } = await client.rpc("revoke_auth_device", {
        p_current_id: identity.id,
        p_current_secret: identity.secret,
        p_target_id: targetId,
      });
      if (error) throw mapExternalError(error);
      if (targetId === identity.id) {
        await storage.clear();
        const { error: signOutError } = await client.auth.signOut();
        if (signOutError) throw mapExternalError(signOutError);
      }
    },
  };
}
