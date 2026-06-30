// create-concierge — Supabase Edge Function
// Called from TMS admin panel to create a concierge account atomically:
//   auth.users → concierges → user_roles
// Verify JWT: ON (TMS sends user JWT; function confirms admin role before proceeding)

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SB_URL = Deno.env.get('SUPABASE_URL')!
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const sb = createClient(SB_URL, SB_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export default {
  async fetch(req: Request): Promise<Response> {
    try {
      // ── 1. Verify caller is an authenticated admin ──────────────────────────
      const auth = req.headers.get('Authorization')
      if (!auth) return json({ error: 'Unauthorized' }, 401)

      const { data: { user }, error: ue } = await sb.auth.getUser(auth.replace('Bearer ', ''))
      if (ue || !user) return json({ error: 'Invalid session' }, 401)

      const { data: roleRow } = await sb
        .from('user_roles').select('role').eq('user_id', user.id).single()
      if (roleRow?.role !== 'admin') return json({ error: 'Forbidden — admin only' }, 403)

      // ── 2. Parse and validate body ─────────────────────────────────────────
      const body = await req.json()
      const { first_name, last_name, email, phone, partner_id } = body

      if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !partner_id) {
        return json({ error: 'first_name, last_name, email, and partner_id are required' }, 400)
      }

      const cleanEmail = email.trim().toLowerCase()

      // ── 3. Create auth user (confirmed, temp password) ─────────────────────
      const { data: created, error: ce } = await sb.auth.admin.createUser({
        email: cleanEmail,
        password: crypto.randomUUID().replace(/-/g, '').slice(0, 12) + 'Aa1!',
        email_confirm: true,
      })
      if (ce) return json({ error: ce.message }, 400)

      const userId = created.user.id

      // ── 4. Create concierge record ─────────────────────────────────────────
      const { data: conc, error: concErr } = await sb
        .from('concierges')
        .insert({
          user_id:    userId,
          partner_id,
          first_name: first_name.trim(),
          last_name:  last_name.trim(),
          email:      cleanEmail,
          phone:      phone?.trim() || null,
        })
        .select()
        .single()

      if (concErr) {
        await sb.auth.admin.deleteUser(userId)
        return json({ error: concErr.message }, 400)
      }

      // ── 5. Create user_roles entry ─────────────────────────────────────────
      const { error: roleErr } = await sb.from('user_roles').insert({
        user_id:      userId,
        role:         'concierge',
        partner_id,
        concierge_id: conc.id,
      })

      if (roleErr) {
        await sb.auth.admin.deleteUser(userId)
        await sb.from('concierges').delete().eq('id', conc.id)
        return json({ error: roleErr.message }, 400)
      }

      // ── 6. Generate password-set link so concierge can log in ─────────────
      const { data: linkData } = await sb.auth.admin.generateLink({
        type:    'recovery',
        email:   cleanEmail,
        options: { redirectTo: 'https://partners.shersanctuary.com' },
      })
      const loginLink = linkData?.properties?.action_link ?? null

      return json({
        success:      true,
        concierge_id: conc.id,
        user_id:      userId,
        login_link:   loginLink,
      })

    } catch (err) {
      console.error('create-concierge error:', err)
      return json({ error: String(err) }, 500)
    }
  },
}
