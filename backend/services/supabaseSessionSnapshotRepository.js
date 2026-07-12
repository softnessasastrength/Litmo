import { createClient } from '@supabase/supabase-js';
import { SessionSnapshotError } from './sessionSnapshotService.js';

function requireServerConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new SessionSnapshotError('snapshot_service_unavailable', 503);
  }
  return { url, serviceRoleKey };
}

function fail(error) {
  if (error) throw new SessionSnapshotError('snapshot_storage_failed', 503);
}

export function createSupabaseSessionSnapshotRepository() {
  const { url, serviceRoleKey } = requireServerConfig();
  const client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return {
    async authenticate(accessToken) {
      const { data, error } = await client.auth.getUser(accessToken);
      if (error) return null;
      return data.user?.id ?? null;
    },
    async getSession(sessionId) {
      const { data, error } = await client
        .from('sessions')
        .select('id,user_a,user_b,status')
        .eq('id', sessionId)
        .maybeSingle();
      fail(error);
      return data;
    },
    async getLatestProfileVersions(userId) {
      const [touchResult, consentResult] = await Promise.all([
        client
          .from('touch_profile_versions')
          .select('id,user_id,version,profile,created_at')
          .eq('user_id', userId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle(),
        client
          .from('consent_preference_versions')
          .select('user_id,version,preferences,created_at')
          .eq('user_id', userId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      fail(touchResult.error);
      fail(consentResult.error);
      return { touch: touchResult.data, consent: consentResult.data };
    },
    async persistSnapshot(snapshot) {
      const { data, error } = await client.rpc('create_session_snapshot', {
        p_session_id: snapshot.sessionId,
        p_profile_a_id: snapshot.profileAId,
        p_profile_a_version: snapshot.profileAVersion,
        p_profile_b_id: snapshot.profileBId,
        p_profile_b_version: snapshot.profileBVersion,
        p_fingerprint: snapshot.fingerprint,
        p_compatibility: snapshot.compatibility,
      });
      fail(error);
      return data;
    },
  };
}
