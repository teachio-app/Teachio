import { createClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — bypasses RLS.
 * ONLY used server-side for:
 *   - Atomic credit operations (try_use_credit RPC)
 *   - Storage uploads (audio files)
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
