import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { saveRole } from '@/lib/actions/onboarding'
import { OnboardingCards } from '@/components/ui/OnboardingCards'

export default async function OnboardingPage() {
  // If the user already has a role, skip straight to their dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'teacher') redirect('/teacher')
  if (profile?.role === 'student') redirect('/student')

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative"
      style={{
        background: 'linear-gradient(145deg,#ede9fe 0%,#ddd6fe 20%,#e0e7ff 45%,#f3e8ff 70%,#fce7f3 100%)',
      }}
    >
      {/* Subtle background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute rounded-full" style={{ width:'900px',height:'900px',top:'-350px',left:'-350px', background:'radial-gradient(circle,rgba(99,102,241,0.35) 0%,transparent 65%)' }} />
        <div className="absolute rounded-full" style={{ width:'800px',height:'800px',bottom:'-250px',right:'-200px', background:'radial-gradient(circle,rgba(168,85,247,0.30) 0%,transparent 65%)' }} />
      </div>

      <div className="relative w-full max-w-2xl space-y-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
            <span className="text-white font-black text-2xl">T</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vítejte v Teachiu</h1>
            <p className="text-slate-500 mt-1 text-base">Řekněte nám, kdo jste — přizpůsobíme aplikaci přesně pro vás.</p>
          </div>
        </div>

        {/* Role cards — animated client component */}
        <OnboardingCards
          saveTeacher={saveRole.bind(null, 'teacher')}
          saveStudent={saveRole.bind(null, 'student')}
        />

        <p className="text-center text-xs text-slate-400">
          Svoji roli můžete kdykoli změnit v nastavení účtu.
        </p>
      </div>
    </div>
  )
}
