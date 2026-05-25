import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { AdminClient, type AdminRow } from './AdminClient'

const ADMIN_EMAIL = 'petulk.pech@gmail.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/')

  // Fetch all auth users
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const authUsers = authData?.users ?? []

  // Fetch profiles including new usage counter
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, role, credits, total_credits_used, current_streak, last_active_date, created_at')

  // Join
  const rows: AdminRow[] = authUsers
    .map(au => {
      const p = profiles?.find(x => x.id === au.id)
      return {
        id:          au.id,
        email:       au.email ?? '—',
        role:        (p?.role as 'teacher' | 'student' | null) ?? null,
        credits:     (p?.credits as number) ?? 0,
        creditsUsed: (p?.total_credits_used as number) ?? 0,
        streak:      (p?.current_streak as number) ?? 0,
        lastActive:  (p?.last_active_date as string | null) ?? null,
        joined:      au.created_at,
      }
    })
    .sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime())

  const today       = new Date().toISOString().split('T')[0]
  const total       = rows.length
  const teachers    = rows.filter(r => r.role === 'teacher').length
  const students    = rows.filter(r => r.role === 'student').length
  const activeToday = rows.filter(r => r.lastActive === today).length
  const streaking   = rows.filter(r => r.streak > 1).length

  const stats = [
    { label: 'Celkem uživatelů', value: total,       icon: '👥' },
    { label: 'Učitelé',          value: teachers,    icon: '👨‍🏫' },
    { label: 'Studenti',         value: students,    icon: '🎓' },
    { label: 'Aktivní dnes',     value: activeToday, icon: '🟢' },
    { label: 'Na streaku',       value: streaking,   icon: '🔥' },
  ]

  return <AdminClient rows={rows} stats={stats} />
}
