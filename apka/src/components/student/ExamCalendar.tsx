'use client'

import {
  useState, useEffect, useMemo, useRef, useCallback,
  forwardRef, useImperativeHandle,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

type SchoolLevel = 'ZŠ' | 'SŠ' | 'VŠ'
type Material    = 'PDF' | 'Screenshot' | 'Text'
type Intensity   = 'daily' | 'every-other' | 'weekends'
type Language    = 'cs' | 'en' | 'de'
type SourceStrat = 'only-mine' | 'augmented' | 'teachio-only'
type Phase       = 'intro' | 'deepen' | 'practice' | 'review' | 'final'
type GameType    = 'Quiz' | 'Flashcards' | 'Matching'

interface DayModules {
  notes:      string
  trivia:     string
  hasPodcast: boolean
  gameType:   GameType
}

interface StudyDay {
  date:      string
  phase:     Phase
  phaseName: string
  task:      string
  modules:   DayModules
}

interface ExamPlan {
  topic: string; examDate: string; schoolLevel: SchoolLevel; grade: string
  schoolName: string; mastery: number; materials: Material[]; language: Language
  sourceStrat: SourceStrat; intensity: Intensity
  studyDays: StudyDay[]; completedDates: string[]; createdDate: string
}

export interface ExamCalendarHandle { openModal: (defaultTopic?: string) => void }

// ── School database (15+ per level) ───────────────────────────────────────────

const OTHER_SCHOOL = 'Ostatní / Nevidím svou školu'

const SCHOOLS: Record<SchoolLevel, string[]> = {
  ZŠ: [
    'ZŠ Amos', 'ZŠ a MŠ Uhelný trh', 'ZŠ Nový PORG', 'ZŠ pod Marjánkou',
    'ZŠ Kotlářská Brno', 'ZŠ Táborská', 'ZŠ Hanspaulka', 'ZŠ Londýnská',
    'ZŠ Na Beránku', 'ZŠ Horáčkova', 'ZŠ Ořechovka', 'ZŠ Sázavská',
    'ZŠ Kunratice', 'ZŠ T.G.Masaryka Poděbrady', 'ZŠ Březová',
    OTHER_SCHOOL,
  ],
  SŠ: [
    'Gymnázium Jana Keplera', 'Gymnázium Nad Alejí', 'SPŠ Smíchov',
    'Obchodní akademie Vinohradská', 'Smíchovská SPŠ a gymnázium',
    'Gymnázium Christiana Dopplera', 'Gymnázium Na Pražačce',
    'Gymnázium Budějovická', 'Gymnázium Botičská', 'SPŠE Ječná',
    'Gymnázium Jana Nerudy', 'Lyceum Elišky Krásnohorské',
    'Gymnázium Třeboň', 'Gymnázium Brno, Matyáše Lercha',
    'Gymnázium Brno, Slovanské náměstí',
    OTHER_SCHOOL,
  ],
  VŠ: [
    'Univerzita Karlova (UK)', 'Vysoké učení technické (VUT)',
    'České vysoké učení technické (ČVUT)', 'Masarykova univerzita (MUNI)',
    'Vysoká škola ekonomická (VŠE)', 'Univerzita Jana Evangelisty Purkyně (UJEP)',
    'Technická univerzita v Liberci (TUL)', 'Jihočeská univerzita (JU)',
    'Univerzita Palackého v Olomouci (UP)', 'Mendelova univerzita (MENDELU)',
    'Vysoká škola báňská (VŠB-TUO)', 'Česká zemědělská univerzita (ČZU)',
    'Univerzita Hradec Králové (UHK)', 'Slezská univerzita v Opavě (SU)',
    'Akademie múzických umění (AMU)',
    OTHER_SCHOOL,
  ],
}

// ── Content templates ──────────────────────────────────────────────────────────

const NOTES: Record<SchoolLevel, Record<Phase, (t: string) => string>> = {
  ZŠ: {
    intro:    t => `Dnes se seznámíš se základy tématu "${t}". Zapiš si klíčové pojmy a vysvětli je vlastními slovy — cíl je pochopit, o čem téma je, ne memorovat.`,
    deepen:   t => `Prohlubujeme znalosti o "${t}". Prostuduj každý pojem podrobněji a vymysli k němu příklad z každodenního života. Nakresli schéma nebo obrázek.`,
    practice: t => `Procvičuj "${t}" pomocí flashkaret a krátkého kvízu. Cíl: odpovědět na 5 otázek bez chyby. Každou chybu si vysvětli nahlas.`,
    review:   t => `Opakuj "${t}" se zaměřením na místa, kde jsi minule chyboval/a. Projdi si chytáky a typické záměny — to je přesně co zkoušející testuje.`,
    final:    t => `Finální příprava na "${t}". Simuluj test: bez tahání, na čas. Po každé chybě přečti vysvětlení a napiš správnou odpověď 3×.`,
  },
  SŠ: {
    intro:    t => `Úvod do "${t}": vytvořte mind mapu klíčových konceptů. Identifikujte hlavní pojmy a jejich vzájemné vztahy. Čtěte téma dvakrát — nejprve rychle (skenování), pak analyticky.`,
    deepen:   t => `Analytická fáze "${t}": jak spolu koncepty souvisí? Nakreslete schéma závislostí a formulujte 3 otázky, které by mohl položit zkoušející na písemce.`,
    practice: t => `Procvičování "${t}": testové otázky + flashkarty bez chyby. Cíl: 90 % správně. Zaměřte se na otázky, kde jste si nebyli jistí.`,
    review:   t => `Opakování "${t}": projděte Exam Traps a slabá místa. Napište 5 vět popisujících typické záměny pojmů a proč jsou špatně.`,
    final:    t => `Simulace testu z "${t}": timer, bez tahání, celý rozsah. Vyhodnoťte výsledky — každá chyba = téma k opakování před testem.`,
  },
  VŠ: {
    intro:    t => `Systematické studium "${t}": identifikujte klíčové teoretické rámce, hlavní autory a paradigmata oboru. Sestavte seznam primárních zdrojů.`,
    deepen:   t => `Kritická analýza "${t}": porovnejte přístupy různých autorů — kde se shodují, kde se liší? Napište 400 slovní syntézu hlavní akademické debaty.`,
    practice: t => `Aplikace teorií "${t}": vyberte 2 reálné případy a aplikujte studované koncepty. Procvičte akademické formulace: "Podle [autor] platí, že..."`,
    review:   t => `Příprava na komisi z "${t}": formulujte odpovědi na 5 komplexních otázek. Zaměřte se na syntézu, kritické hodnocení a propojení teorií.`,
    final:    t => `Mock exam z "${t}": 90 minut, akademický styl, bez přerušení. Simulujte podmínky státní zkoušky — hodnoťte dle kritérií VŠ komise.`,
  },
}

const TRIVIA: Record<Phase, string[]> = {
  intro:    [
    'Mozek ukládá informace nejlépe v prvních 20 minutách studia. Začínej vždy tím nejdůležitějším!',
    'Metoda "elaborativního výslechu" — ptát se sám/a sebe PROČ věci fungují — zvyšuje retenci o 40 %.',
    'Psaní rukou = 2× lepší zapamatování než psaní na klávesnici (studie Cambridge, 2023).',
  ],
  deepen:   [
    'Feynmanova technika: vysvětli téma tak, jako by mu rozumělo dítě. Pokud nejde, stále to ještě nechápeš.',
    'Interleaving — střídání různých témat — vede k lepšímu porozumění než bloková metoda o 25 %.',
    'Každý nový koncept propoj se 3 věcmi, které již znáš. Mozek ukládá informace ve vztazích, ne izolovaně.',
  ],
  practice: [
    'Retrieval practice (testování sebe sama) je 2–4× účinnější než opakované čtení stejného textu.',
    'Každá chyba s okamžitou zpětnou vazbou "opravuje" synaptickou cestu v mozku — chyby jsou vzácné!',
    'Spaced repetition — opakování ve stále delších intervalech — je nejúčinnější metoda pro dlouhodobou paměť.',
  ],
  review:   [
    'Přeučování (overlearning) i po 100% zvyšuje retenci o dalších 20–30 %. Nepřestávej hned po prvním úspěchu.',
    'Vysvětlování látky ostatním (Protégé Effect) prokazatelně zlepšuje vlastní porozumění i retenci.',
    'Krátkodobý eustress před testem zlepšuje výkon. Nervozita je normální signál — přeznač ji jako "vzrušení".',
  ],
  final:    [
    'Spánek 7–9 hodin před testem zvyšuje výkon o 20–30 %. Noční biflování je vždy méně efektivní.',
    '"Brain dump" metoda: na začátku testu zapiš vše, co víš. Uvolní pracovní paměť pro řešení otázek.',
    'Pravidlo 2 minut: pokud tě otázka blokuje déle než 2 minuty, přejdi dál. Vrať se s čistou hlavou.',
  ],
}

const GAME_FOR: Record<Phase, GameType> = {
  intro: 'Flashcards', deepen: 'Matching', practice: 'Quiz', review: 'Quiz', final: 'Quiz',
}

const PHASE_COLOR: Record<Phase, string> = {
  intro: '#60a5fa', deepen: '#a78bfa', practice: '#34d399', review: '#fbbf24', final: '#f87171',
}
const PHASE_LABEL: Record<Phase, string> = {
  intro: 'Úvod', deepen: 'Prohloubení', practice: 'Procvičení', review: 'Opakování', final: 'Finále',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'teachio_exam_plan_v4'
const DAY_CZ = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']

function toISO(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function fromISO(s: string) { const [y,m,d]=s.split('-').map(Number); return new Date(y,m-1,d) }
function dayDiff(a: Date, b: Date) { return Math.round((b.getTime()-a.getTime())/86_400_000) }

function generatePlan(f: { topic:string; examDate:string; schoolLevel:SchoolLevel; mastery:number; intensity:Intensity }): StudyDay[] {
  const today=new Date(); today.setHours(0,0,0,0)
  const exam=fromISO(f.examDate)
  const total=dayDiff(today,exam)
  if(total<=0) return []

  const candidates: Date[]=[]
  for(let i=0;i<total;i++){
    const d=new Date(today); d.setDate(today.getDate()+i); const dow=d.getDay()
    if(f.intensity==='weekends'    && dow!==0 && dow!==6) continue
    if(f.intensity==='every-other' && i%2!==0)            continue
    candidates.push(d)
  }

  const selected=candidates.slice(0,Math.max(1,Math.round(candidates.length*(f.mastery/100))))
  const n=selected.length
  const topic=f.topic.length>28?f.topic.slice(0,28)+'…':f.topic

  function getPhase(idx:number): Phase {
    const r=n<=1?1:idx/(n-1)
    if(r<=0.15) return 'intro'; if(r<=0.40) return 'deepen'
    if(r<=0.65) return 'practice'; if(r<=0.85) return 'review'; return 'final'
  }

  return selected.map((d,idx)=>{
    const ph=getPhase(idx)
    const triviaArr=TRIVIA[ph]
    return {
      date:      toISO(d),
      phase:     ph,
      phaseName: PHASE_LABEL[ph],
      task:      PHASE_LABEL[ph],
      modules: {
        notes:      NOTES[f.schoolLevel][ph](topic),
        trivia:     triviaArr[idx % triviaArr.length],
        hasPodcast: ph==='intro'||ph==='deepen'||ph==='final',
        gameType:   GAME_FOR[ph],
      },
    }
  })
}

// ── Default form ───────────────────────────────────────────────────────────────

const DEFAULT = {
  topic:'', examDate:'', schoolLevel:'SŠ' as SchoolLevel, grade:'', schoolName:'',
  mastery:80, materials:[] as Material[], language:'cs' as Language,
  sourceStrat:'augmented' as SourceStrat, intensity:'every-other' as Intensity,
}

// ── Wizard slide variants ──────────────────────────────────────────────────────

const slide = {
  enter:  (d:number) => ({ x:d>0?60:-60, opacity:0 }),
  center: { x:0, opacity:1 },
  exit:   (d:number) => ({ x:d>0?-60:60, opacity:0 }),
}

// ── SchoolCombobox ─────────────────────────────────────────────────────────────

function SchoolCombobox({ value, onChange, level }: { value:string; onChange:(v:string)=>void; level:SchoolLevel }) {
  const [query,      setQuery]      = useState(value)
  const [open,       setOpen]       = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [custom,     setCustom]     = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const schools = SCHOOLS[level]
  const filtered = query.length >= 1
    ? schools.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : schools

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [open])

  // Reset when level changes if value not in new level's list
  useEffect(() => {
    const allSchools = [...SCHOOLS[level]]
    if (value && !allSchools.includes(value)) { setQuery(''); setCustom(''); setShowCustom(false); onChange('') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  function select(s: string) {
    if (s === OTHER_SCHOOL) {
      setShowCustom(true); setQuery(OTHER_SCHOOL); setOpen(false); onChange('')
    } else {
      setShowCustom(false); setQuery(s); onChange(s); setOpen(false)
    }
  }

  const border = (value || showCustom) ? '1px solid rgba(99,102,241,0.45)' : '1px solid rgba(255,255,255,0.09)'

  if (showCustom) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input value={custom} onChange={e => { setCustom(e.target.value); onChange(e.target.value) }}
            placeholder="Napiš název své školy…"
            className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none"
            style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(99,102,241,0.45)', color:'#f1f5f9' }} />
          <button onClick={() => { setShowCustom(false); setQuery(''); onChange('') }}
            className="text-xs px-3 py-2 rounded-xl" style={{ background:'rgba(255,255,255,0.06)', color:'#64748b' }}>
            ← Zpět
          </button>
        </div>
        <p className="text-xs px-1" style={{ color:'#475569' }}>Škola není v seznamu — napiš ji ručně</p>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <input value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={`Hledat ${level==='ZŠ'?'základní školu':level==='SŠ'?'střední školu':'vysokou školu'}…`}
        className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
        style={{ background:'rgba(255,255,255,0.05)', border, color:'#f1f5f9' }} />
      {query && (
        <button onClick={() => { setQuery(''); onChange(''); setOpen(false) }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
          style={{ color:'#475569' }}>✕</button>
      )}
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
            transition={{ duration:0.12 }}
            className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl overflow-hidden z-50 max-h-52 overflow-y-auto"
            style={{ background:'rgba(10,10,24,0.97)', border:'1px solid rgba(99,102,241,0.22)', boxShadow:'0 16px 40px rgba(0,0,0,0.6)', backdropFilter:'blur(20px)' }}>
            {filtered.map(s => (
              <button key={s} type="button" onClick={() => select(s)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                style={{ color: s===OTHER_SCHOOL?'#64748b':s===value?'#a78bfa':'#94a3b8',
                         borderTop: s===OTHER_SCHOOL?'1px solid rgba(255,255,255,0.06)':'none' }}>
                {s===value && <span className="mr-2 text-violet-400">✓</span>}
                {s===OTHER_SCHOOL?<span>✏️ {s}</span>:s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Required label helper ──────────────────────────────────────────────────────

function Req({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest" style={{ color:'#64748b' }}>
      {children}<span style={{ color:'#f87171' }}>*</span>
    </label>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

export const ExamCalendar = forwardRef<ExamCalendarHandle>((_, ref) => {
  const [plan,       setPlan]       = useState<ExamPlan|null>(null)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [form,       setForm]       = useState(DEFAULT)
  const [step,       setStep]       = useState(1)
  const [dir,        setDir]        = useState(1)
  const [calOffset,  setCalOffset]  = useState(0)
  const [activeDay,  setActiveDay]  = useState<string|null>(null)
  const [notifOn,    setNotifOn]    = useState(false)
  const [fileReady,       setFileReady]       = useState(false)
  const [isDragOverUpload,setIsDragOverUpload] = useState(false)
  const [selectedFiles,    setSelectedFiles]     = useState<File[]>([])
  const [langOpen,  setLangOpen]  = useState(false)
  const [srcOpen,   setSrcOpen]   = useState(false)
  const [actionModal,setActionModal]= useState<'audio'|'quiz'|'flashcards'|'matching'|null>(null)
  const [audioPlaying,setAudioPlaying]= useState(false)
  const [fcIdx,  setFcIdx]  = useState(0)
  const [fcFlipped,setFcFlipped]= useState(false)

  useImperativeHandle(ref, () => ({ openModal: (defaultTopic?: string) => { setStep(1); setDir(1); setModalOpen(true); if (defaultTopic) setForm(f => ({ ...f, topic: f.topic || defaultTopic })) } }))

  // Escape
  useEffect(() => {
    if (!modalOpen) return
    const h = (e:KeyboardEvent) => { if (e.key==='Escape'&&step!==4) { setModalOpen(false); setStep(1) } }
    document.addEventListener('keydown',h); return ()=>document.removeEventListener('keydown',h)
  }, [modalOpen,step])

  // Persistence
  useEffect(() => {
    try {
      const raw=localStorage.getItem(STORAGE_KEY)
      if(raw){
        const p=JSON.parse(raw) as ExamPlan; setPlan(p)
        setForm(f=>({...f,...p, materials:p.materials??[], completedDates:undefined as unknown as Material[]}))
      }
    } catch {}
  }, [])

  const savePlan = useCallback((p:ExamPlan)=>{
    setPlan(p); try{localStorage.setItem(STORAGE_KEY,JSON.stringify(p))}catch{}
  },[])

  const todayISO     = toISO(new Date())
  const daysLeft     = plan ? dayDiff(new Date(),fromISO(plan.examDate)) : null
  const windowedDays = useMemo(()=>plan?.studyDays.slice(calOffset*7,calOffset*7+7)??[],[plan,calOffset])
  const maxOffset    = plan ? Math.max(0,Math.ceil(plan.studyDays.length/7)-1) : 0
  const mastery      = useMemo(()=>{
    if(!plan||plan.studyDays.length===0)return 0
    return Math.round((plan.completedDates.length/plan.studyDays.length)*100)
  },[plan])

  // Active day data — prefers clicked day, falls back to today's or first day
  const activeDayData = useMemo(()=>{
    if(!plan) return null
    const target = activeDay ?? todayISO
    return plan.studyDays.find(d=>d.date===target) ?? plan.studyDays[0] ?? null
  },[plan,activeDay,todayISO])

  // Validation per step
  const step1Valid = form.topic.trim().length > 0 && form.examDate.length > 0
  const step2Valid = form.grade.trim().length > 0 && form.schoolName.trim().length > 0
  const previewDays = form.examDate ? dayDiff(new Date(),fromISO(form.examDate)) : 0

  function go(n:number){ setDir(n>step?1:-1); setStep(n) }

  function generate(){
    go(4)
    setTimeout(()=>{
      const studyDays=generatePlan(form)
      savePlan({...form,topic:form.topic.trim(),studyDays,completedDates:[],createdDate:todayISO})
      setCalOffset(0); setActiveDay(null); setModalOpen(false); setStep(1)
    },2200)
  }

  function toggleMaterial(m:Material){
    setForm(f=>({...f,materials:f.materials.includes(m)?f.materials.filter(x=>x!==m):[...f.materials,m]}))
    setFileReady(false)
    setSelectedFiles([])
  }

  function getAcceptAttr(materials: Material[]): string {
    const types: string[] = []
    if (materials.includes('PDF'))        types.push('.pdf,application/pdf')
    if (materials.includes('Screenshot')) types.push('image/*')
    if (materials.includes('Text'))       types.push('.txt,.md,text/plain')
    return types.join(',') || '*'
  }

  function formatBytes(b: number) {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b/1024).toFixed(0)} kB`
    return `${(b/1024/1024).toFixed(1)} MB`
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length > 0) {
      setSelectedFiles(files)
      setFileReady(true)
    }
  }

  function handleUploadDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setIsDragOverUpload(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setSelectedFiles(files)
      setFileReady(true)
    }
  }

  function toggleDone(iso:string){
    if(!plan)return
    const has=plan.completedDates.includes(iso)
    savePlan({...plan,completedDates:has?plan.completedDates.filter(d=>d!==iso):[...plan.completedDates,iso]})
  }

  function clearPlan(){ setPlan(null); try{localStorage.removeItem(STORAGE_KEY)}catch{} }

  const minDate = toISO(new Date(Date.now()+86_400_000))

  const inp = (filled:boolean):React.CSSProperties => ({
    background:'rgba(255,255,255,0.05)',
    border:`1px solid ${filled?'rgba(99,102,241,0.45)':'rgba(255,255,255,0.09)'}`,
    color:'#f1f5f9',
  })

  // ── Widget ────────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="sm:col-span-2 rounded-2xl overflow-hidden"
        style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color:'#7c3aed' }}>📅 Zkouškový kalendář</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color:plan?'#e2e8f0':'#64748b' }}>
              {plan ? `${plan.topic} · ${plan.schoolLevel}${plan.grade?` ${plan.grade}. roč.`:''} · ${daysLeft!==null&&daysLeft>=0?`za ${daysLeft} dní`:'test proběhl'}`
                    : 'Nastav zkouškový termín'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {plan && (
              <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                style={{ background:mastery>=70?'rgba(74,222,128,0.15)':'rgba(124,58,237,0.15)', color:mastery>=70?'#4ade80':'#a78bfa' }}>
                {mastery}% hotovo
              </span>
            )}
            {plan && (
              <Link href={`/student/exam/${encodeURIComponent(plan.topic.toLowerCase().replace(/\s+/g,'-').slice(0,40))}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                style={{ background:'rgba(99,102,241,0.12)', color:'#818cf8', border:'1px solid rgba(99,102,241,0.20)' }}>
                Otevřít →
              </Link>
            )}
            <button onClick={()=>{setStep(1);setDir(1);setModalOpen(true)}}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
              style={{ background:'rgba(124,58,237,0.15)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.25)' }}>
              {plan?'✏️':'+ Vytvořit plán'}
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {!plan && (
            <div className="text-center py-5 space-y-4">
              <div className="text-4xl">🗓️</div>
              <div className="space-y-1">
                <p className="text-sm font-bold" style={{ color:'#94a3b8' }}>Nastav zkouškový termín a Teachio sestaví denní studijní plán</p>
                <p className="text-xs" style={{ color:'#475569' }}>Kvízy, podcast a flashkarty na každý den — přizpůsobené tvému tempu</p>
              </div>
              <button onClick={()=>{setStep(1);setDir(1);setModalOpen(true)}}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background:'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow:'0 8px 24px rgba(99,102,241,0.35)' }}>
                🗓️ Vytvořit studijní plán
              </button>
            </div>
          )}

          {plan && plan.studyDays.length > 0 && (
            <>
              {/* Days remaining countdown */}
              {daysLeft !== null && daysLeft >= 0 && (
                <div className="flex items-center gap-3 px-1">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(2, 100 - (daysLeft / Math.max(1, dayDiff(fromISO(plan.createdDate), fromISO(plan.examDate)))) * 100)}%`,
                        background: daysLeft <= 3 ? 'linear-gradient(90deg,#ef4444,#f87171)' : daysLeft <= 7 ? 'linear-gradient(90deg,#d97706,#fbbf24)' : 'linear-gradient(90deg,#6366f1,#a855f7)',
                      }} />
                  </div>
                  <span className="text-xs font-black shrink-0 tabular-nums"
                    style={{ color: daysLeft === 0 ? '#f87171' : daysLeft <= 3 ? '#fca5a5' : daysLeft <= 7 ? '#fbbf24' : '#a78bfa' }}>
                    {daysLeft === 0 ? '⚠️ Dnes!' : `za ${daysLeft} ${daysLeft === 1 ? 'den' : daysLeft < 5 ? 'dny' : 'dní'}`}
                  </span>
                </div>
              )}

              {/* Timeline */}
              <div className="flex items-center gap-2">
                <button onClick={()=>setCalOffset(o=>Math.max(0,o-1))} disabled={calOffset===0}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm disabled:opacity-20"
                  style={{ background:'rgba(255,255,255,0.05)', color:'#64748b' }}>‹</button>
                <div className="flex-1 flex gap-1 justify-between">
                  {windowedDays.map(sd=>{
                    const d=fromISO(sd.date); const isToday=sd.date===todayISO; const isSel=sd.date===(activeDay??todayISO)
                    const isDone=plan.completedDates.includes(sd.date); const isPast=sd.date<todayISO
                    const isExam=sd.date===plan.examDate; const c=PHASE_COLOR[sd.phase]
                    return (
                      <button key={sd.date} onClick={()=>setActiveDay(sd.date===activeDay?null:sd.date)}
                        className="flex-1 flex flex-col items-center gap-1 py-0.5">
                        <span className="text-xs font-medium" style={{ color:isToday?'#a78bfa':'#334155' }}>{DAY_CZ[d.getDay()]}</span>
                        <motion.div
                          animate={isToday?{boxShadow:['0 0 0px rgba(124,58,237,0)','0 0 12px rgba(124,58,237,0.5)','0 0 0px rgba(124,58,237,0)']}:{}}
                          transition={{ duration:2.4, repeat:Infinity }}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all"
                          style={isExam?{background:'rgba(239,68,68,0.15)',borderColor:'rgba(239,68,68,0.55)',color:'#fca5a5'}
                            :isDone?{background:'rgba(74,222,128,0.15)',borderColor:'rgba(74,222,128,0.35)',color:'#4ade80'}
                            :isSel?{background:`${c}22`,borderColor:c,color:c}
                            :isToday?{background:'linear-gradient(135deg,#6366f1,#7c3aed)',borderColor:'transparent',color:'#fff'}
                            :isPast?{background:'transparent',borderColor:'rgba(255,255,255,0.04)',color:'#1e293b'}
                            :{background:'rgba(255,255,255,0.04)',borderColor:'rgba(255,255,255,0.08)',color:'#475569'}}>
                          {isDone?'✓':d.getDate()}
                        </motion.div>
                        {isExam?<span className="text-xs font-black" style={{ color:'#f87171',lineHeight:1 }}>TEST</span>
                          :<span className="w-1.5 h-1.5 rounded-full" style={{ background:isDone?'#4ade80':isPast?'#0f172a':c }} />}
                      </button>
                    )
                  })}
                </div>
                <button onClick={()=>setCalOffset(o=>Math.min(maxOffset,o+1))} disabled={calOffset>=maxOffset}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm disabled:opacity-20"
                  style={{ background:'rgba(255,255,255,0.05)', color:'#64748b' }}>›</button>
              </div>

              {/* Legend */}
              <div className="flex gap-3 flex-wrap">
                {(Object.keys(PHASE_LABEL) as Phase[]).map(ph=>(
                  <span key={ph} className="flex items-center gap-1 text-xs" style={{ color:'#334155' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background:PHASE_COLOR[ph] }}/>{PHASE_LABEL[ph]}
                  </span>
                ))}
              </div>

              {/* Mastery bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span style={{ color:'#475569' }}>Splněno: {plan.completedDates.length} / {plan.studyDays.length} dnů</span>
                  <span style={{ color:mastery>=70?'#4ade80':'#a78bfa' }}>{mastery}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                  <motion.div animate={{ width:`${mastery}%` }} transition={{ duration:0.7, ease:'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background:mastery>=70?'linear-gradient(90deg,#22c55e,#4ade80)':'linear-gradient(90deg,#6366f1,#a855f7)' }} />
                </div>
              </div>

              {/* ── Daily Action Board ── */}
              <AnimatePresence mode="wait">
                {activeDayData && daysLeft!==null && daysLeft>=0 && (
                  <motion.div key={activeDayData.date}
                    initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                    transition={{ duration:0.2 }}
                    className="space-y-2">

                    {/* Board header */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest"
                        style={{ color:PHASE_COLOR[activeDayData.phase] }}>
                        {activeDayData.date===todayISO?'Dnešní akční plán'
                          :`${fromISO(activeDayData.date).toLocaleDateString('cs-CZ',{day:'numeric',month:'short'})} · ${activeDayData.phaseName}`}
                        {plan.schoolLevel==='VŠ'?' · Akademická úroveň':''}
                      </p>
                      <button onClick={()=>toggleDone(activeDayData.date)}
                        className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                        style={{ background:plan.completedDates.includes(activeDayData.date)?'rgba(74,222,128,0.15)':'rgba(255,255,255,0.06)', color:plan.completedDates.includes(activeDayData.date)?'#4ade80':'#64748b', border:`1px solid ${plan.completedDates.includes(activeDayData.date)?'rgba(74,222,128,0.30)':'rgba(255,255,255,0.09)'}` }}>
                        {plan.completedDates.includes(activeDayData.date)?'✓ Splněno':'Označit splněno'}
                      </button>
                    </div>

                    {/* Bento grid */}
                    <div className="grid grid-cols-2 gap-2">

                      {/* Card 1 — Výpisky (full width) */}
                      <div className="col-span-2 rounded-xl p-4"
                        style={{ background:`${PHASE_COLOR[activeDayData.phase]}09`, border:`1px solid ${PHASE_COLOR[activeDayData.phase]}22` }}>
                        <p className="text-xs font-bold mb-2" style={{ color:PHASE_COLOR[activeDayData.phase] }}>📋 Výpisky</p>
                        <p className="text-sm leading-relaxed"
                          style={{ color:plan.completedDates.includes(activeDayData.date)?'#334155':'#cbd5e1', textDecoration:plan.completedDates.includes(activeDayData.date)?'line-through':'none' }}>
                          {activeDayData.modules.notes}
                        </p>
                      </div>

                      {/* Card 2 — Zajímavost */}
                      <div className="rounded-xl p-3.5"
                        style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.18)' }}>
                        <p className="text-xs font-bold mb-1.5" style={{ color:'#fbbf24' }}>💡 Zajímavost</p>
                        <p className="text-xs leading-relaxed" style={{ color:'#94a3b8' }}>
                          {activeDayData.modules.trivia}
                        </p>
                      </div>

                      {/* Card 3 — Podcast */}
                      <div className="rounded-xl p-3.5 flex flex-col justify-between"
                        style={{ background:'rgba(219,39,119,0.07)', border:'1px solid rgba(219,39,119,0.18)' }}>
                        <p className="text-xs font-bold mb-2" style={{ color:'#f472b6' }}>🎧 Podcast</p>
                        {activeDayData.modules.hasPodcast ? (
                          <button onClick={() => { setAudioPlaying(false); setActionModal('audio') }}
                            className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-80"
                            style={{ background:'linear-gradient(135deg,#db2777,#f472b6)', boxShadow:'0 4px 12px rgba(219,39,119,0.30)' }}>
                            Přehrát dnešní podcast
                          </button>
                        ) : (
                          <p className="text-xs" style={{ color:'#475569' }}>Dostupný v intro/deepen/final fázích</p>
                        )}
                      </div>

                      {/* Card 4 — Trénink (full width) */}
                      <div className="col-span-2 rounded-xl p-3.5"
                        style={{ background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.22)' }}>
                        <p className="text-xs font-bold mb-2" style={{ color:'#818cf8' }}>🎮 Trénink</p>
                        <motion.button
                          onClick={() => setActionModal(
                            activeDayData.modules.gameType==='Flashcards'?'flashcards':
                            activeDayData.modules.gameType==='Matching'?'matching':'quiz'
                          )}
                          whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                          className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all"
                          style={{ background:'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow:'0 4px 16px rgba(99,102,241,0.35)' }}>
                          🎮 Spustit {activeDayData.modules.gameType}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {daysLeft!==null&&daysLeft<0&&(
                <div className="text-center py-2 space-y-1">
                  <p className="text-sm font-bold" style={{ color:'#4ade80' }}>🎉 Zkouška proběhla!</p>
                  <button onClick={clearPlan} className="text-xs underline" style={{ color:'#475569' }}>Vymazat plán</button>
                </div>
              )}

              {/* Notifications */}
              <button onClick={()=>setNotifOn(n=>!n)}
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:opacity-80 transition-all"
                style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <span className="flex items-center gap-2.5 text-xs font-semibold" style={{ color:'#64748b' }}>
                  🔔 Zapnout upozornění na telefon
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'rgba(124,58,237,0.12)', color:'#7c3aed' }}>Brzy</span>
                </span>
                <div className="relative w-9 h-5 rounded-full transition-colors" style={{ background:notifOn?'#6366f1':'rgba(255,255,255,0.10)' }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all" style={{ left:notifOn?'1.1rem':'0.125rem' }} />
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Multi-step Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div key="bd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={()=>{ if(step!==4){setModalOpen(false);setStep(1)} }}
              className="fixed inset-0 z-40"
              style={{ background:'rgba(0,0,0,0.83)', backdropFilter:'blur(6px)' }} />

            <motion.div key="modal"
              initial={{ opacity:0, scale:0.93, y:24 }} animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.93, y:24 }}
              transition={{ duration:0.22, ease:[0.22,1,0.36,1] }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
              style={{ maxHeight:'92vh', overflowY:'auto' }}>

              <div className="rounded-3xl overflow-hidden"
                style={{ background:'#080814', border:'1px solid rgba(99,102,241,0.22)', boxShadow:'0 40px 100px rgba(0,0,0,0.85)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)' }}>
                <div className="h-0.5 w-full" style={{ background:'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)' }} />

                <div className="p-6">
                  {/* Progress dots */}
                  {step<4&&(
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex gap-2">
                        {[1,2,3].map(s=>(
                          <div key={s} className="h-1.5 rounded-full transition-all duration-300"
                            style={{ width:step===s?'28px':'8px', background:s<=step?'#6366f1':'rgba(255,255,255,0.10)' }} />
                        ))}
                      </div>
                      <button onClick={()=>{setModalOpen(false);setStep(1)}}
                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5 transition-all"
                        style={{ color:'#475569' }}>✕</button>
                    </div>
                  )}

                  <div className="overflow-hidden">
                    <AnimatePresence mode="wait" custom={dir}>

                      {/* ── Step 1: Základní cíl ── */}
                      {step===1&&(
                        <motion.div key="s1" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
                          transition={{ duration:0.22, ease:'easeInOut' }} className="space-y-5">
                          <div>
                            <h2 className="text-xl font-black" style={{ color:'#f1f5f9' }}>Základní cíl</h2>
                            <p className="text-xs mt-1" style={{ color:'#475569' }}>Krok 1 ze 3 — Co se učíš a kdy máš test?</p>
                          </div>
                          <div className="space-y-1.5">
                            <Req>Téma / Předmět</Req>
                            <input type="text" value={form.topic} onChange={e=>setForm(f=>({...f,topic:e.target.value}))}
                              placeholder="Např. Fotosyntéza, Francouzská revoluce…"
                              className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none" style={inp(!!form.topic)} />
                          </div>
                          <div className="space-y-1.5">
                            <Req>Datum testu</Req>
                            <input type="date" value={form.examDate} min={minDate}
                              onChange={e=>setForm(f=>({...f,examDate:e.target.value}))}
                              className="w-full px-4 py-3.5 rounded-2xl text-sm font-semibold outline-none"
                              style={{ ...inp(!!form.examDate), colorScheme:'dark' }} />
                            {form.examDate&&(
                              <p className="text-xs px-1" style={{ color:'#a78bfa' }}>📅 Za {previewDays} dní</p>
                            )}
                          </div>
                          <button onClick={()=>go(2)} disabled={!step1Valid}
                            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background:'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow:step1Valid?'0 6px 24px rgba(99,102,241,0.40)':'none' }}>
                            Pokračovat →
                          </button>
                        </motion.div>
                      )}

                      {/* ── Step 2: Tvůj kontext ── */}
                      {step===2&&(
                        <motion.div key="s2" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
                          transition={{ duration:0.22, ease:'easeInOut' }} className="space-y-5">
                          <div>
                            <h2 className="text-xl font-black" style={{ color:'#f1f5f9' }}>Tvůj kontext</h2>
                            <p className="text-xs mt-1" style={{ color:'#475569' }}>Krok 2 ze 3 — Řekni nám o sobě</p>
                          </div>
                          <div className="space-y-1.5">
                            <Req>Typ školy</Req>
                            <div className="grid grid-cols-3 gap-2">
                              {(['ZŠ','SŠ','VŠ'] as SchoolLevel[]).map(lvl=>(
                                <button key={lvl} onClick={()=>setForm(f=>({...f,schoolLevel:lvl,schoolName:''}))}
                                  className="py-3 rounded-xl font-bold text-sm transition-all"
                                  style={{ background:form.schoolLevel===lvl?'rgba(99,102,241,0.22)':'rgba(255,255,255,0.04)', border:form.schoolLevel===lvl?'1px solid rgba(99,102,241,0.50)':'1px solid rgba(255,255,255,0.08)', color:form.schoolLevel===lvl?'#818cf8':'#475569' }}>
                                  {lvl}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Req>Ročník</Req>
                            <input type="text" value={form.grade} onChange={e=>setForm(f=>({...f,grade:e.target.value}))}
                              placeholder="Např. 3" className="w-full px-4 py-3 rounded-2xl text-sm outline-none" style={inp(!!form.grade)} />
                          </div>
                          <div className="space-y-1.5">
                            <Req>Název školy</Req>
                            <SchoolCombobox
                              value={form.schoolName}
                              onChange={v=>setForm(f=>({...f,schoolName:v}))}
                              level={form.schoolLevel}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={()=>go(1)}
                              className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-70"
                              style={{ background:'rgba(255,255,255,0.06)', color:'#64748b' }}>← Zpět</button>
                            <button onClick={()=>go(3)} disabled={!step2Valid}
                              className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{ background:'linear-gradient(135deg,#6366f1,#7c3aed)', boxShadow:step2Valid?'0 6px 24px rgba(99,102,241,0.40)':'none' }}>
                              Pokračovat →
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* ── Step 3: Strategie & Data ── */}
                      {step===3&&(
                        <motion.div key="s3" custom={dir} variants={slide} initial="enter" animate="center" exit="exit"
                          transition={{ duration:0.22, ease:'easeInOut' }} className="space-y-5">
                          <div>
                            <h2 className="text-xl font-black" style={{ color:'#f1f5f9' }}>Strategie & Data</h2>
                            <p className="text-xs mt-1" style={{ color:'#475569' }}>Krok 3 ze 3 — Nastav intenzitu a zdroje</p>
                          </div>

                          {/* Mastery */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1" style={{ color:'#64748b' }}>
                                Cílová připravenost<span style={{ color:'#f87171' }}>*</span>
                              </span>
                              <span className="text-sm font-black" style={{ color:'#a78bfa' }}>{form.mastery}%</span>
                            </div>
                            <input type="range" min={50} max={100} step={5} value={form.mastery}
                              onChange={e=>setForm(f=>({...f,mastery:Number(e.target.value)}))}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                              style={{ accentColor:'#7c3aed', background:`linear-gradient(to right,#7c3aed ${(form.mastery-50)/50*100}%,rgba(255,255,255,0.1) 0%)` }} />
                            <div className="flex justify-between text-xs" style={{ color:'#1e293b' }}>
                              <span>50%</span><span>100%</span>
                            </div>
                          </div>

                          {/* Intensity */}
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1" style={{ color:'#64748b' }}>
                              Intenzita<span style={{ color:'#f87171' }}>*</span>
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              {([['daily','Každý den','Max'],['every-other','Ob den','Doporuč.'],['weekends','Víkendy','Lehce']] as [Intensity,string,string][]).map(([v,l,s])=>(
                                <button key={v} onClick={()=>setForm(f=>({...f,intensity:v}))}
                                  className="px-2 py-2.5 rounded-xl text-left transition-all"
                                  style={{ background:form.intensity===v?'rgba(124,58,237,0.18)':'rgba(255,255,255,0.04)', border:form.intensity===v?'1px solid rgba(124,58,237,0.40)':'1px solid rgba(255,255,255,0.07)' }}>
                                  <p className="text-xs font-bold" style={{ color:form.intensity===v?'#a78bfa':'#64748b' }}>{l}</p>
                                  <p className="text-xs" style={{ color:'#334155' }}>{s}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Materials */}
                          <div className="space-y-1.5">
                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'#64748b' }}>Studijní materiály</span>
                            <div className="grid grid-cols-3 gap-2">
                              {(['PDF','Screenshot','Text'] as Material[]).map(m=>(
                                <button key={m} onClick={()=>toggleMaterial(m)}
                                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                                  style={{ background:form.materials.includes(m)?'rgba(99,102,241,0.15)':'rgba(255,255,255,0.04)', border:form.materials.includes(m)?'1px solid rgba(99,102,241,0.40)':'1px solid rgba(255,255,255,0.07)' }}>
                                  <span className="text-xl">{m==='PDF'?'📄':m==='Screenshot'?'🖼️':'📝'}</span>
                                  <span className="text-xs font-bold" style={{ color:form.materials.includes(m)?'#818cf8':'#475569' }}>{m}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Language + Source — custom dark dropdowns */}
                          <div className="grid grid-cols-2 gap-2">
                            {/* Language */}
                            <div className="space-y-1">
                              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1" style={{ color:'#64748b' }}>
                                Jazyk<span style={{ color:'#f87171' }}>*</span>
                              </span>
                              <div className="relative">
                                <button type="button" onClick={()=>{setLangOpen(v=>!v);setSrcOpen(false)}}
                                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all"
                                  style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${langOpen?'rgba(124,58,237,0.50)':'rgba(255,255,255,0.08)'}`, color:'#f1f5f9' }}>
                                  <span>{form.language==='cs'?'🇨🇿 Čeština':form.language==='en'?'🇬🇧 Angličtina':'🇩🇪 Němčina'}</span>
                                  <span style={{ color:'#475569', fontSize:'10px' }}>▾</span>
                                </button>
                                {langOpen && (
                                  <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
                                    style={{ background:'rgba(18,18,28,0.98)', border:'1px solid rgba(124,58,237,0.30)', boxShadow:'0 12px 32px rgba(0,0,0,0.6)' }}>
                                    {([['cs','🇨🇿 Čeština'],['en','🇬🇧 Angličtina'],['de','🇩🇪 Němčina']] as [Language,string][]).map(([val,label])=>(
                                      <button key={val} type="button"
                                        onClick={()=>{setForm(f=>({...f,language:val}));setLangOpen(false)}}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                                        style={{ color:form.language===val?'#a78bfa':'#94a3b8' }}>
                                        {label}
                                        {form.language===val && <span style={{ color:'#7c3aed', fontSize:'12px' }}>✓</span>}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Source strategy */}
                            <div className="space-y-1">
                              <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1" style={{ color:'#64748b' }}>
                                Zdroj dat<span style={{ color:'#f87171' }}>*</span>
                              </span>
                              <div className="relative">
                                <button type="button" onClick={()=>{setSrcOpen(v=>!v);setLangOpen(false)}}
                                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all"
                                  style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${srcOpen?'rgba(124,58,237,0.50)':'rgba(255,255,255,0.08)'}`, color:'#f1f5f9' }}>
                                  <span className="truncate text-left">{form.sourceStrat==='only-mine'?'Jen moje mat.':form.sourceStrat==='augmented'?'Moje + AI':'Jen Teachio AI'}</span>
                                  <span style={{ color:'#475569', fontSize:'10px', flexShrink:0, marginLeft:'4px' }}>▾</span>
                                </button>
                                {srcOpen && (
                                  <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden"
                                    style={{ background:'rgba(18,18,28,0.98)', border:'1px solid rgba(124,58,237,0.30)', boxShadow:'0 12px 32px rgba(0,0,0,0.6)' }}>
                                    {([
                                      ['only-mine',    'Pouze moje materiály'],
                                      ['augmented',    'Moje mat. + Teachio AI'],
                                      ['teachio-only', 'Pouze Teachio AI'],
                                    ] as [SourceStrat,string][]).map(([val,label])=>(
                                      <button key={val} type="button"
                                        onClick={()=>{setForm(f=>({...f,sourceStrat:val}));setSrcOpen(false)}}
                                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-white/5"
                                        style={{ color:form.sourceStrat===val?'#a78bfa':'#94a3b8' }}>
                                        {label}
                                        {form.sourceStrat===val && <span style={{ color:'#7c3aed', fontSize:'12px' }}>✓</span>}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Upload zone — shown when materials selected AND not teachio-only */}
                  {form.materials.length > 0 && form.sourceStrat !== 'teachio-only' && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-1" style={{ color:'#64748b' }}>
                        Nahrát materiály<span style={{ color:'#f87171' }}>*</span>
                      </p>
                      <label
                        className="w-full flex flex-col items-center gap-2 py-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer"
                        style={{
                          borderColor: fileReady ? 'rgba(74,222,128,0.50)' : isDragOverUpload ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.12)',
                          background:  fileReady ? 'rgba(74,222,128,0.06)' : isDragOverUpload ? 'rgba(124,58,237,0.06)' : 'rgba(255,255,255,0.02)',
                        }}
                        onDragEnter={e => { e.preventDefault(); setIsDragOverUpload(true) }}
                        onDragOver={e => { e.preventDefault(); setIsDragOverUpload(true) }}
                        onDragLeave={e => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOverUpload(false) }}
                        onDrop={handleUploadDrop}
                      >
                        {fileReady ? (
                          <div className="text-center space-y-1.5 pointer-events-none w-full px-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto" style={{ background:'rgba(74,222,128,0.15)' }}>
                              <span className="text-base">✓</span>
                            </div>
                            {selectedFiles.slice(0, 3).map((f, i) => (
                              <p key={i} className="text-xs font-medium truncate" style={{ color:'#4ade80' }}>
                                {f.name} <span style={{ color:'#64748b' }}>({formatBytes(f.size)})</span>
                              </p>
                            ))}
                            {selectedFiles.length > 3 && (
                              <p className="text-xs" style={{ color:'#64748b' }}>+{selectedFiles.length - 3} dalších</p>
                            )}
                            <button
                              type="button"
                              className="pointer-events-auto text-xs px-2.5 py-1 rounded-lg transition-colors hover:opacity-80 mt-1"
                              style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171' }}
                              onClick={e => { e.preventDefault(); setSelectedFiles([]); setFileReady(false) }}>
                              ✕ Odebrat
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-2xl">📎</span>
                            <p className="text-xs font-semibold" style={{ color: isDragOverUpload ? '#a78bfa' : '#64748b' }}>
                              {isDragOverUpload ? '🎯 Pusť soubory!' : `Přetáhni nebo klikni pro nahrání ${form.materials.join(' / ')}`}
                            </p>
                          </>
                        )}
                        <input
                          type="file"
                          multiple
                          accept={getAcceptAttr(form.materials)}
                          className="sr-only"
                          onChange={handleFileInputChange}
                        />
                      </label>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={()=>go(2)}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-sm hover:opacity-70 transition-all"
                      style={{ background:'rgba(255,255,255,0.06)', color:'#64748b' }}>← Zpět</button>
                    <button onClick={generate}
                      disabled={form.materials.length > 0 && !fileReady && form.sourceStrat !== 'teachio-only'}
                      className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background:'linear-gradient(135deg,#6366f1,#7c3aed,#a855f7)', boxShadow:(form.materials.length===0||fileReady||form.sourceStrat==='teachio-only')?'0 8px 28px rgba(124,58,237,0.50)':'none' }}>
                      ✨ Vygenerovat plán
                    </button>
                  </div>
                          {plan&&(
                            <button onClick={()=>{clearPlan();setModalOpen(false);setStep(1)}}
                              className="w-full text-xs font-medium text-center hover:opacity-80"
                              style={{ color:'#334155' }}>Vymazat stávající plán</button>
                          )}
                        </motion.div>
                      )}

                      {/* ── Step 4: Loading ── */}
                      {step===4&&(
                        <motion.div key="s4" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                          transition={{ duration:0.3 }} className="py-10 space-y-6 text-center">
                          <motion.div
                            animate={{ boxShadow:['0 0 0px rgba(34,197,94,0)','0 0 30px rgba(34,197,94,0.38)','0 0 0px rgba(34,197,94,0)'] }}
                            transition={{ duration:1.8, repeat:Infinity }}
                            className="inline-flex items-start gap-3 px-5 py-4 rounded-2xl"
                            style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.28)' }}>
                            <motion.div animate={{ scale:[1,1.4,1] }} transition={{ duration:1.2, repeat:Infinity }}
                              className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ background:'#22c55e', boxShadow:'0 0 10px #22c55e' }} />
                            <div className="text-left">
                              <p className="text-sm font-black" style={{ color:'#4ade80' }}>Teachio Fact-Check Engine Aktivní</p>
                              <p className="text-xs mt-0.5" style={{ color:'#64748b' }}>Křížové ověřování materiálů — žádné halucinace AI</p>
                            </div>
                          </motion.div>
                          <div className="flex justify-center">
                            <motion.div animate={{ rotate:360 }} transition={{ duration:1.2, repeat:Infinity, ease:'linear' }}
                              className="w-12 h-12 rounded-full border-2"
                              style={{ borderColor:'rgba(124,58,237,0.20)', borderTopColor:'#7c3aed' }} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold" style={{ color:'#f1f5f9' }}>Generuji tvůj studijní plán…</p>
                            <p className="text-xs" style={{ color:'#475569' }}>
                              {form.schoolLevel} · {form.schoolName || form.topic} · {form.mastery}% cíl
                            </p>
                          </div>
                        </motion.div>
                      )}

                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Action modals (podcast / quiz / flashcards / matching) ── */}
      <AnimatePresence>
        {actionModal && (
          <>
            <motion.div key="am-bd" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setActionModal(null)}
              className="fixed inset-0 z-50"
              style={{ background:'rgba(0,0,0,0.80)', backdropFilter:'blur(6px)' }} />

            <motion.div key="am-modal"
              initial={{ opacity:0, scale:0.93, y:20 }} animate={{ opacity:1, scale:1, y:0 }}
              exit={{ opacity:0, scale:0.93, y:20 }}
              transition={{ duration:0.22, ease:[0.22,1,0.36,1] }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4">
              <div className="rounded-3xl overflow-hidden"
                style={{ background:'#080814', border:'1px solid rgba(99,102,241,0.22)', boxShadow:'0 32px 80px rgba(0,0,0,0.80)', backdropFilter:'blur(20px)' }}>
                <div className="h-0.5 w-full" style={{ background:
                  actionModal==='audio'?'linear-gradient(90deg,#db2777,#f472b6)':
                  actionModal==='quiz'?'linear-gradient(90deg,#6366f1,#a855f7)':
                  actionModal==='flashcards'?'linear-gradient(90deg,#059669,#34d399)':
                  'linear-gradient(90deg,#d97706,#fbbf24)' }} />
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black" style={{ color:'#f1f5f9' }}>
                      {actionModal==='audio'?'🎧 Výukový podcast':
                       actionModal==='quiz'?'🧩 Kvíz':
                       actionModal==='flashcards'?'🃏 Flashkarty':'🕹️ Matching'}
                    </p>
                    <button onClick={() => setActionModal(null)} className="text-lg hover:opacity-70" style={{ color:'#475569' }}>✕</button>
                  </div>

                  {/* Audio player */}
                  {actionModal==='audio' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl p-4" style={{ background:'rgba(219,39,119,0.08)', border:'1px solid rgba(219,39,119,0.18)' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background:'rgba(219,39,119,0.15)', border:'1px solid rgba(219,39,119,0.30)' }}>
                            <span>👩‍🏫</span><span className="text-xs font-bold" style={{ color:'#f472b6' }}>Učitelka</span>
                            {audioPlaying && <motion.span animate={{ opacity:[1,0.2,1] }} transition={{ duration:0.9, repeat:Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background:'#db2777' }} />}
                          </div>
                          <div className="px-3 py-1.5 rounded-full" style={{ background:'rgba(99,102,241,0.10)', border:'1px solid rgba(99,102,241,0.20)' }}>
                            <span className="text-xs font-bold" style={{ color:'#818cf8' }}>👨‍🎓 Student</span>
                          </div>
                        </div>
                        <div className="flex items-end gap-[3px] h-8">
                          {Array.from({length:20},(_,i)=>i).map(i=>(
                            <motion.div key={i} className="w-[3px] rounded-full flex-1"
                              style={{ background:'linear-gradient(to top,#db2777,#f472b6)' }}
                              animate={audioPlaying?{scaleY:[0.2,1,0.3,0.8,0.15,1,0.5]}:{scaleY:0.12}}
                              transition={{ duration:0.55+(i%4)*0.12, repeat:audioPlaying?Infinity:0, ease:'easeInOut', delay:i*0.04 }} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs italic" style={{ color:'#64748b' }}>
                        &ldquo;Hele — tohle téma je fascinující. Počkej, nejdřív musím říct proč...&rdquo;
                      </p>
                      <button onClick={() => setAudioPlaying(p=>!p)}
                        className="w-full py-3 rounded-2xl font-bold text-sm text-white"
                        style={{ background:'linear-gradient(135deg,#db2777,#f472b6)', boxShadow:'0 4px 16px rgba(219,39,119,0.40)' }}>
                        {audioPlaying?'⏸ Pozastavit':'▶ Přehrát dnešní podcast'}
                      </button>
                    </div>
                  )}

                  {/* Quiz */}
                  {actionModal==='quiz' && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold" style={{ color:'#e2e8f0' }}>Co je primárním produktem světelné fáze fotosyntézy?</p>
                      {['CO₂ a voda','ATP a NADPH','Glukóza a kyslík','Chlorofyl a světlo'].map((opt,i)=>(
                        <div key={opt} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                          style={{ background:i===1?'rgba(5,150,105,0.15)':'rgba(255,255,255,0.04)', border:i===1?'1px solid rgba(5,150,105,0.40)':'1px solid rgba(255,255,255,0.07)', color:i===1?'#34d399':'#94a3b8' }}>
                          <span className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0"
                            style={{ background:i===1?'rgba(5,150,105,0.25)':'rgba(255,255,255,0.06)', color:i===1?'#34d399':'#64748b' }}>
                            {['A','B','C','D'][i]}
                          </span>
                          <span className="text-sm flex-1">{opt}</span>
                          {i===1&&<span className="text-xs font-bold" style={{ color:'#34d399' }}>✓</span>}
                        </div>
                      ))}
                      <p className="text-xs px-1" style={{ color:'#64748b' }}>💡 Světelná fáze produkuje ATP a NADPH — energetické nosiče pro Calvinův cyklus.</p>
                    </div>
                  )}

                  {/* Flashcards */}
                  {actionModal==='flashcards' && (
                    <div className="space-y-4">
                      <button onClick={() => setFcFlipped(f=>!f)}
                        className="w-full h-28 rounded-2xl flex items-center justify-center p-5 transition-all"
                        style={{ background:fcFlipped?'rgba(5,150,105,0.12)':'rgba(99,102,241,0.10)', border:fcFlipped?'1px solid rgba(5,150,105,0.35)':'1px solid rgba(99,102,241,0.30)' }}>
                        <AnimatePresence mode="wait">
                          <motion.p key={`${fcIdx}-${fcFlipped}`} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                            transition={{ duration:0.18 }} className="text-base font-bold text-center"
                            style={{ color:fcFlipped?'#34d399':'#a78bfa' }}>
                            {fcFlipped
                              ? (['Přeměna světelné energie na chemickou energii pomocí chlorofylu','Zelené barvivo v chloroplastech absorbující světelnou energii','Průduchy v listech umožňující výměnu plynů (CO₂ / O₂)'][fcIdx])
                              : (['Fotosyntéza','Chlorofyl','Stomata'][fcIdx])
                            }
                          </motion.p>
                        </AnimatePresence>
                      </button>
                      <div className="flex items-center justify-between">
                        <button onClick={() => { setFcIdx(i=>(i-1+3)%3); setFcFlipped(false) }}
                          className="px-3 py-1.5 rounded-xl text-xs" style={{ background:'rgba(255,255,255,0.06)', color:'#64748b' }}>← Předchozí</button>
                        <span className="text-xs" style={{ color:'#334155' }}>{fcIdx+1} / 3</span>
                        <button onClick={() => { setFcIdx(i=>(i+1)%3); setFcFlipped(false) }}
                          className="px-3 py-1.5 rounded-xl text-xs" style={{ background:'rgba(255,255,255,0.06)', color:'#64748b' }}>Další →</button>
                      </div>
                    </div>
                  )}

                  {/* Matching */}
                  {actionModal==='matching' && (
                    <div className="space-y-3">
                      <p className="text-xs" style={{ color:'#64748b' }}>Přiřaď pojmy k definicím kliknutím:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[['Fotosyntéza','Tvorba cukrů ze světla'],['Respirace','Uvolnění energie z cukrů'],['Transpirác.','Výpar vody z listů']].map(([t,d])=>(
                          <div key={t} className="contents">
                            <div className="px-3 py-2.5 rounded-xl text-xs font-bold" style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.28)', color:'#a78bfa' }}>{t}</div>
                            <div className="px-3 py-2.5 rounded-xl text-xs" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', color:'#64748b' }}>{d}</div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-center" style={{ color:'#334155' }}>Demo · generuj téma pro plnou verzi</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
})

ExamCalendar.displayName = 'ExamCalendar'
