import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { username } = await req.json()
    const clean = String(username || '').trim().toLowerCase()
    if (!/^[a-z0-9_]{3,30}$/.test(clean)) throw new Error('Invalid username')
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )
    const { data, error } = await admin.from('staff_profiles')
      .select('auth_email,is_active')
      .ilike('username', clean)
      .maybeSingle()
    if (error) throw error
    if (!data?.auth_email || data.is_active === false) throw new Error('Invalid username or password')
    return new Response(JSON.stringify({ email: data.auth_email }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Login failed' }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
