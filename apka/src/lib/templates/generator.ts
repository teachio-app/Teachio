export type SubjectArea =
  | 'history' | 'math' | 'physics' | 'biology'
  | 'chemistry' | 'literature' | 'geography' | 'civics' | 'general'

export type GradeCategory = 'lower' | 'middle' | 'upper'

export interface LessonPlan {
  uvod: string; aktivizace: string; hlavniCast: string; shrnuti: string
}
export interface QuizItem { question: string; answer: string }
export interface GenerationResult {
  lessonPlan: LessonPlan
  quiz: QuizItem[]
  subject: SubjectArea
  subjectLabel: string
  gradeCategory: GradeCategory
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SUBJECT_LABELS: Record<SubjectArea, string> = {
  history: 'Dějepis', math: 'Matematika', physics: 'Fyzika', biology: 'Biologie',
  chemistry: 'Chemie', literature: 'Literatura / ČJ', geography: 'Zeměpis',
  civics: 'Občanská výchova', general: 'Obecný předmět',
}

const PATTERNS: Record<SubjectArea, RegExp> = {
  history:    /revoluc|válk|válec|dějin|histor|středověk|starověk|novověk|antik|císař|král|diktátor|bitva|povstání|napoleon|hitler|stalin|habsbur|husit|třicetilet|světová válka|studená válka|totalit|socialismus|komunism|fašism|nacism|sametová|holokaust|kolonial|feudalism|renesanc|reforma|osvícen/i,
  math:       /rovnic|trojúhelník|čtverec|kružnic|obvod|obsah|objem|funkce|derivac|integrál|algebra|geometri|zlomek|procent|pravděpodobn|statistik|vektor|matice|odmocnin|mocnin|logaritm|kombinatorik|posloupnost|limita|množina|soustavy|kvadratic|pythagoro|úhel|cos|sin|tan/i,
  physics:    /síla|energie|rychlost|zrychlení|elektřina|magnetism|gravitac|teplo|světlo|zvuk|vlnění|atom|molekula|elektron|proud|napětí|odpor|výkon|hybnost|tlak|hustota|optik|spektr|radioaktiv|kvantov|newtonov|relativit|termodynamik/i,
  biology:    /buňka|fotosyntéz|dna|rna|evoluc|ekologi|biotop|metabolism|enzym|hormon|organismus|rostlin|živočich|houba|bakterie|virus|imunit|genetik|dědičnost|chromozom|protein|mitóza|meioza|ekosystém|potravní|biodiverzit|tělo|orgán|svalstvo|kost|nervov/i,
  chemistry:  /prvek|sloučenin|chemická|kyselina|zásada|oxidac|redukc|elektrolýz|polymer|organická chemie|anorganická|periodická|molár|stechiometri|ph|roztok|směs|ionizace|vazba|uhlovodík|reakce.*chem/i,
  literature: /báseň|román|povídka|autor|spisovatel|dílo|literární|hrdina|postava|lyrický|epický|dramatický|próza|poezie|drama|novela|epos|balada|sonet|haiku|mácha|neruda|čapek|shakespeare|kafka|hašek|literatura|český jazyk/i,
  geography:  /kontinent|stát|hlavní město|pohoří|řeka|moře|oceán|podnebí|počasí|reliéf|populace|migrace|zeměpis|atlas|krajina|poloostrov|ostrov|průliv|klima|ekvátor|tropic|asie|evropa|afrika|austrálie|amerika/i,
  civics:     /právo|zákon|ústava|parlament|vláda|prezident|volby|lidská práva|občan|soud|trestní|zákoník|nato|mezinárodní právo|základní práva|demokracie.*spol|svoboda.*spol/i,
  general:    /.*/,
}

function detectSubject(topic: string): SubjectArea {
  const t = topic.toLowerCase()
  for (const [s, r] of Object.entries(PATTERNS) as [SubjectArea, RegExp][]) {
    if (s !== 'general' && r.test(t)) return s
  }
  return 'general'
}

export function getGradeCategory(grade: string): GradeCategory {
  if (grade.includes('ročník')) return 'upper'
  const n = parseInt(grade.match(/\d+/)?.[0] || '5')
  if (n <= 3) return 'lower'
  if (n <= 6) return 'middle'
  return 'upper'
}

function timeSplit(d: number) {
  const intro = Math.round(d * 0.1)
  const activ = Math.round(d * 0.15)
  const main  = Math.round(d * 0.6)
  return { intro, activ, main, summary: d - intro - activ - main }
}

// ── Grade-aware section picker ────────────────────────────────────────────────

function pick(cat: GradeCategory, l: string, m: string, u: string): string {
  return cat === 'lower' ? l : cat === 'middle' ? m : u
}

function pickQuiz(cat: GradeCategory, l: QuizItem[], m: QuizItem[], u: QuizItem[]): QuizItem[] {
  return cat === 'lower' ? l : cat === 'middle' ? m : u
}

// ── HISTORY ───────────────────────────────────────────────────────────────────

function buildHistory(topic: string, t: ReturnType<typeof timeSplit>, grade: string): GenerationResult {
  const cat = getGradeCategory(grade)
  return {
    subject: 'history', subjectLabel: 'Dějepis', gradeCategory: cat,
    lessonPlan: {
      uvod: pick(cat,
        `Úvod (${t.intro} min): Učitel zahájí hodinu krátkým dramatickým příběhem o tématu „${topic}" — jednoduchým vyprávěním s obrázky nebo rekvizitami. Ptá se: „Kdo z vás slyšel o ${topic}?" Cíle hodiny jsou sděleny jako dobrodružství: „Dnes se vydáme do minulosti!"`,
        `Úvod (${t.intro} min): Učitel zobrazí dobovou fotografii nebo mapu k tématu „${topic}" a položí otázku: „Co vidíte? Co si myslíte, že se tehdy dělo?" Žáci sdílejí první asociace. Cíle hodiny jsou formulovány jako dvě klíčové historické otázky.`,
        `Úvod (${t.intro} min): Učitel zahájí hodinu historickým paradoxem nebo provokativní tezí k tématu „${topic}". Žáci zapisují hypotézy. Cíle jsou akademicky strukturovány: příčiny, průběh, důsledky, přesah do současnosti.`
      ),
      aktivizace: pick(cat,
        `Aktivizace (${t.activ} min): Žáci ve skupinkách nakreslí nebo sestaví z obrázků, co o tématu „${topic}" vědí. Výsledky jsou sdíleny — učitel doplní fascinující fakty přiměřené věku. Klíčové pojmy jsou vizualizovány na tabuli jako obrázky i slova.`,
        `Aktivizace (${t.activ} min): Třídní brainstorming — žáci vyjmenovávají vše, co znají o tématu „${topic}". Učitel třídí odpovědi do kategorií: Lidé / Místa / Události / Pojmy. Chybné představy jsou korigovány.`,
        `Aktivizace (${t.activ} min): Myšlenková mapa ve dvojicích — žáci propojují pojmy k tématu „${topic}" (příčiny, aktéři, důsledky, kontext). Výsledky jsou sdíleny a diskutovány, učitel koriguje nepřesnosti a nastolí badatelské otázky.`
      ),
      hlavniCast: pick(cat,
        `Hlavní část (${t.main} min): Výklad tématu „${topic}" formou řízeného příběhu s vizuálními pomůckami (mapa, obrázky, časová osa). Učitel klade jednoduché otázky, žáci odpovídají. Aktivita: žáci sestaví 3–4-prvkovou časovou osu z předpřipravených karet. Klíčová slova jsou zapsána na tabuli.`,
        `Hlavní část (${t.main} min): Chronologický výklad tématu „${topic}" s mapou a časovou osou. Skupinová práce: každá skupina dostane jednu část (příčiny / průběh / důsledky) a stručně ji prezentuje. Průběžně jsou vysvětlovány a zapisovány klíčové pojmy.`,
        `Hlavní část (${t.main} min): Výklad tématu „${topic}" s využitím primárních pramenů (dobové texty, karikatury, statistiky). Žáci ve skupinách analyzují zdroje a identifikují různé historické perspektivy. Proběhne strukturovaná diskuse. Klíčové pojmy jsou systematicky zaznamenány.`
      ),
      shrnuti: pick(cat,
        `Shrnutí (${t.summary} min): Hra „Pravda/Nepravda" — učitel přečte 4 tvrzení o tématu „${topic}", žáci reagují pohybem nebo kartičkami. Zopakování 3 klíčových faktů. Motivační závěr.`,
        `Shrnutí (${t.summary} min): Žáci doplní větné rámce: „Téma ${topic} se odehrálo, protože… Důsledkem bylo… Dnes to má vliv na…" Opakování pojmů. Případné zadání domácího úkolu.`,
        `Shrnutí (${t.summary} min): Metoda „3–2–1" — 3 nové poznatky, 2 klíčové pojmy, 1 otevřená otázka. Hodnocení počátečních hypotéz. Propojení s aktuálností. Badatelský domácí úkol.`
      ),
    },
    quiz: pickQuiz(cat,
      [
        { question: `Kdy a kde se přibližně odehrálo téma „${topic}"?`, answer: `Žák uvede přibližné časové a místo. Hodnotí se základní orientace v čase, ne přesná data.` },
        { question: `Kdo byl nejdůležitější člověk nebo skupina lidí spojená s tématem „${topic}"?`, answer: `Žák pojmenuje alespoň jednu klíčovou postavu nebo skupinu. Hodnotí se věcná správnost.` },
        { question: `Co se stalo v rámci tématu „${topic}"? Popiš to vlastními slovy.`, answer: `Žák shrne průběh jednoduše vlastními slovy. Hodnotí se věcná správnost, ne formální jazyk.` },
        { question: `Proč si myslíš, že se to stalo? Vymysli aspoň jeden důvod.`, answer: `Žák uvede jednu příčinu. Hodnotí se logické uvažování přiměřené věku.` },
        { question: `Co tě na tématu „${topic}" nejvíce zaujalo nebo překvapilo?`, answer: `Žák sdílí osobní reflexi. Správná odpověď neexistuje — hodnotí se zájem a angažovanost.` },
      ],
      [
        { question: `Kdy a za jakých okolností se odehrálo téma „${topic}"? Uveďte klíčová data a pozadí.`, answer: `Žák popíše časové zasazení s alespoň dvěma klíčovými daty a historickým kontextem. Hodnotí se přesnost.` },
        { question: `Kdo byli hlavní aktéři tématu „${topic}" a co chtěli dosáhnout?`, answer: `Žák pojmenuje minimálně dva aktéry a charakterizuje jejich cíle. Hodnotí se znalost jmen a pochopení motivací.` },
        { question: `Jaké byly hlavní příčiny tématu „${topic}"?`, answer: `Žák uvede dvě až tři příčiny a stručně je vysvětlí. Hodnotí se správnost a analytické myšlení.` },
        { question: `Jaké byly přímé důsledky tématu „${topic}" pro tehdejší společnost?`, answer: `Žák popíše konkrétní změny (politické, sociální, hospodářské). Hodnotí se přesnost a schopnost rozlišit důsledky.` },
        { question: `Proč je téma „${topic}" důležité pro pochopení dějin? Zdůvodněte.`, answer: `Žák propojí téma s širším historickým vývojem a zdůvodní přínos. Hodnotí se argumentace.` },
      ],
      [
        { question: `Analyzujte příčiny tématu „${topic}" — rozlište krátkodobé (bezprostřední) a dlouhodobé (strukturální) příčiny.`, answer: `Žák identifikuje a odlišuje okamžité spouštěče od hlubokých příčin. Hodnotí se analytické historické myšlení.` },
        { question: `Zhodnoťte roli klíčových aktérů tématu „${topic}" — jaká byla jejich motivace a jak ovlivnili průběh událostí?`, answer: `Žák analyzuje motivace z různých perspektiv. Hodnotí se hloubka analýzy a kritické hodnocení.` },
        { question: `Jaké byly přímé a nepřímé důsledky tématu „${topic}" pro různé vrstvy společnosti?`, answer: `Žák rozlišuje okamžité a dlouhodobé dopady na různé skupiny. Hodnotí se komplexnost analýzy.` },
        { question: `Porovnejte téma „${topic}" s jiným historickým jevem. V čem se podobají a v čem liší?`, answer: `Žák provede komparaci s identifikací shodných i rozdílných prvků. Hodnotí se syntetické myšlení.` },
        { question: `Jaký je přesah tématu „${topic}" do dnešní doby? Doložte konkrétními příklady.`, answer: `Žák propojí minulost s přítomností. Hodnotí se kritické myšlení a přenos historických poznatků.` },
      ]
    ),
  }
}

// ── MATH ─────────────────────────────────────────────────────────────────────

function buildMath(topic: string, t: ReturnType<typeof timeSplit>, grade: string): GenerationResult {
  const cat = getGradeCategory(grade)
  return {
    subject: 'math', subjectLabel: 'Matematika', gradeCategory: cat,
    lessonPlan: {
      uvod: pick(cat,
        `Úvod (${t.intro} min): Učitel uvede téma „${topic}" prostřednictvím konkrétního předmětu nebo příběhu z každodenního života. Žáci hádají nebo manipulují s předměty. Cíle jsou sděleny jednoduše: „Dnes se naučíme, jak vypočítat..."`,
        `Úvod (${t.intro} min): Učitel uvede téma „${topic}" reálným problémem (cena v obchodě, délka hřiště). Žáci odhadují řešení. Cíle hodiny jsou formulovány stručně a srozumitelně.`,
        `Úvod (${t.intro} min): Učitel předloží téma „${topic}" prostřednictvím netriviálního problému nebo aplikace z praxe (architektura, fyzika, finance). Žáci diskutují o přístupu. Cíle jsou akademicky formulovány.`
      ),
      aktivizace: pick(cat,
        `Aktivizace (${t.activ} min): Opakování pomocí hry nebo pohybu — žáci odpovídají na 2–3 jednoduché otázky z předchozí látky, která s tématem „${topic}" přímo souvisí. Správné odpovědi jsou okamžitě pochváleny a vizualizovány.`,
        `Aktivizace (${t.activ} min): Diagnostická minipísemka — 2–3 příklady z předchozí látky potřebné pro pochopení tématu „${topic}". Výsledky jsou rychle opraveny a případné mezery stručně doplněny.`,
        `Aktivizace (${t.activ} min): Žáci samostatně vyřeší 2 propedeutické příklady a sami vyhodnotí správnost. Proběhne rychlá diskuse o strategiích řešení. Učitel propojí s tématem „${topic}".`
      ),
      hlavniCast: pick(cat,
        `Hlavní část (${t.main} min): Učitel zavede téma „${topic}" pomocí manipulativních pomůcek (geometrické tvary, obrázky, počitadlo). Každý krok je ukázán pomalu s komentářem. Žáci opakují postup společně a poté individuálně na předpřipravených pracovních listech s vizuální oporou.`,
        `Hlavní část (${t.main} min): Výklad tématu „${topic}" s pracovním listem — učitel ukazuje postup krok za krokem na tabuli, žáci paralelně pracují na listu. Poté žáci ve dvojicích řeší příklady s postupně rostoucí obtížností. Vzorová řešení jsou porovnána a diskutována.`,
        `Hlavní část (${t.main} min): Formální zavedení tématu „${topic}" s důrazem na matematickou přesnost (definice, věta, důkaz nebo odvození). Žáci řeší příklady samostatně, poté ve skupinách diskutují o různých přístupech k řešení. Proběhne alespoň jedna aplikační úloha z reálné situace.`
      ),
      shrnuti: pick(cat,
        `Shrnutí (${t.summary} min): Žáci společně zopakují postup pro téma „${topic}" — učitel ukazuje kroky a žáci je pojmenovávají. Jeden „exit příklad" je řešen ústně jako ověření. Pochvala za snahu.`,
        `Shrnutí (${t.summary} min): Žáci zapíší vzorec nebo pravidlo tématu „${topic}" do sešitu vlastními slovy. Učitel zadá jeden exit příklad k samostatnému řešení. Výsledky jsou porovnány.`,
        `Shrnutí (${t.summary} min): Žáci formulují definici a klíčový postup tématu „${topic}" bez pomůcek. Exit příklad je řešen individuálně, poté je diskutováno o případných chybách a strategiích. Propojení s budoucím učivem.`
      ),
    },
    quiz: pickQuiz(cat,
      [
        { question: `Co znamená „${topic}"? Zkus to vysvětlit vlastními slovy nebo nakreslit.`, answer: `Žák vlastními slovy nebo obrázkem popíše, co téma znamená. Hodnotí se porozumění, ne formální definice.` },
        { question: `Kde v životě se setkáváme s „${topic}"? Dej jeden příklad.`, answer: `Žák uvede konkrétní příklad z každodenního života. Hodnotí se schopnost propojit matematiku s realitou.` },
        { question: `Jak se vypočítá nebo jak se pracuje s tématem „${topic}"? Popiš postup.`, answer: `Žák popíše základní postup. Hodnotí se správnost kroků, ne formální jazyk.` },
        { question: `Zkus vyřešit jednoduchý příklad s tématem „${topic}".`, answer: `Žák vyřeší jednoduchý příklad přiměřený věku. Hodnotí se správnost výsledku a použití správného postupu.` },
        { question: `Co bylo na tématu „${topic}" pro tebe nejtěžší? Jak sis s tím poradil(a)?`, answer: `Žák reflektuje svůj učební proces. Hodnotí se sebepoznání a ochota sdílet obtíže.` },
      ],
      [
        { question: `Definujte pojem „${topic}" a zapište příslušný vzorec nebo zápis.`, answer: `Žák uvede definici a správný vzorec. Hodnotí se matematická přesnost formulace.` },
        { question: `Popište postup výpočtu v rámci tématu „${topic}" krok za krokem.`, answer: `Žák uvede logický algoritmus řešení. Hodnotí se správnost pořadí kroků.` },
        { question: `Uveďte příklad z reálného života, kde se „${topic}" využívá.`, answer: `Žák uvede věcně správný příklad. Hodnotí se originalita a správnost kontextu.` },
        { question: `Vyřešte příklad: [Učitel doplní konkrétní příklad přiměřený ročníku a tématu „${topic}"].`, answer: `Žák ukáže postup řešení a správný výsledek. Hodnotí se správnost a přehlednost řešení.` },
        { question: `Jak téma „${topic}" navazuje na matematiku, kterou jste se učili dříve?`, answer: `Žák propojí téma s předchozím učivem. Hodnotí se schopnost systémového pohledu na matematiku.` },
      ],
      [
        { question: `Definujte téma „${topic}" přesně a zapište odpovídající matematický zápis (vzorec, rovnici nebo větu).`, answer: `Žák uvede přesnou formální definici a správný zápis. Hodnotí se matematická korektnost a úplnost.` },
        { question: `Odvoďte nebo zdůvodněte klíčový vzorec nebo postup pro téma „${topic}".`, answer: `Žák ukáže matematické odvození nebo logické zdůvodnění. Hodnotí se schopnost matematické argumentace.` },
        { question: `Kde dochází nejčastěji k chybám při práci s tématem „${topic}"? Vysvětlete, proč jsou nesprávné.`, answer: `Žák identifikuje typické chyby a analyticky vysvětlí jejich podstatu. Hodnotí se kritické matematické myšlení.` },
        { question: `Aplikujte téma „${topic}" na reálnou situaci (fyzika, ekonomie, architektura…). Formulujte a vyřešte úlohu.`, answer: `Žák formuluje a vyřeší vlastní aplikační úlohu. Hodnotí se schopnost modelování a přenos matematiky do praxe.` },
        { question: `Jak téma „${topic}" souvisí s ostatními oblastmi matematiky a kde se s ním setkáme v dalším studiu?`, answer: `Žák propojí téma systémově s jinými matematickými oblastmi. Hodnotí se šíře matematického přehledu.` },
      ]
    ),
  }
}

// ── BIOLOGY ──────────────────────────────────────────────────────────────────

function buildBiology(topic: string, t: ReturnType<typeof timeSplit>, grade: string): GenerationResult {
  const cat = getGradeCategory(grade)
  return {
    subject: 'biology', subjectLabel: 'Biologie', gradeCategory: cat,
    lessonPlan: {
      uvod: pick(cat,
        `Úvod (${t.intro} min): Učitel přinese reálný biologický objekt nebo obrázek spojený s tématem „${topic}" (přírodnina, mikroskopický preparát, model). Žáci ho pozorují a sdílejí, co vidí. Otázka: „Jak si myslíte, že to funguje?"`,
        `Úvod (${t.intro} min): Učitel zobrazí mikroskopickou fotografii nebo video jevu „${topic}". Žáci formulují první otázky a hypotézy. Motivační rámec: „Proč tato biologická funkce existuje?"`,
        `Úvod (${t.intro} min): Učitel předloží biologický paradox nebo výzkumný problém spojený s tématem „${topic}". Žáci diskutují na základě dosavadních znalostí. Cíle jsou formulovány jako badatelské otázky.`
      ),
      aktivizace: pick(cat,
        `Aktivizace (${t.activ} min): Žáci třídí obrázky nebo kartičky organismů/struktur spojených s tématem „${topic}" do skupin. Výsledky jsou sdíleny a diskutovány — učitel doplní, co k třídění žáci použili za kritéria.`,
        `Aktivizace (${t.activ} min): Myšlenková mapa — žáci zapíší vše, co znají o tématu „${topic}" z předchozích hodin nebo běžného života. Učitel koriguje mýty a nastíní strukturu dnešní hodiny.`,
        `Aktivizace (${t.activ} min): Žáci ve dvojicích formulují výzkumné otázky k tématu „${topic}" a seřadí je od nejdůležitější. Výsledky jsou sdíleny a učitel propojí s cíly hodiny.`
      ),
      hlavniCast: pick(cat,
        `Hlavní část (${t.main} min): Výklad tématu „${topic}" s názornými pomůckami (modely, obrázky, videa). Učitel vysvětluje jednoduše a klade průběžné otázky. Žáci doplňují pracovní list s obrázky a jednoduché popisy. Skupinová aktivita: žáci přiřadí pojmy k obrázkům.`,
        `Hlavní část (${t.main} min): Strukturovaný výklad tématu „${topic}" se zaměřením na strukturu a funkci. Žáci kreslí schémata a popisují je. Ve skupinách diskutují: „Co by se stalo, kdyby tato funkce přestala fungovat?" Klíčové pojmy jsou průběžně zaznamenávány.`,
        `Hlavní část (${t.main} min): Výklad tématu „${topic}" s vědeckou terminologií a primárními zdroji (vědecké schéma, výzkumný výstup). Žáci analyzují biologické procesy z evolučního a ekologického hlediska. Skupinová debata o vědeckém kontextu a aktuálních výzkumech.`
      ),
      shrnuti: pick(cat,
        `Shrnutí (${t.summary} min): Žáci ukáží na modelu nebo obrázku tři části nebo funkce tématu „${topic}". Opakování klíčových pojmů pomocí otázek. Propojení s přírodou, kterou žáci znají.`,
        `Shrnutí (${t.summary} min): Metoda „Teach back" ve dvojicích — žáci vysvětlí podstatu tématu „${topic}" spolužákovi. Učitel ověří klíčové pojmy. Zdůraznění ekologického nebo zdravotního dosahu.`,
        `Shrnutí (${t.summary} min): Žáci napíší krátkou vědeckou miniabstrakci (3–4 věty): co je „${topic}", jak funguje a proč je biologicky důležité. Sdílení a vzájemné hodnocení. Propojení s aktuálními biologickými výzkumy.`
      ),
    },
    quiz: pickQuiz(cat,
      [
        { question: `Co je „${topic}"? Zkus to popsat nebo nakreslit.`, answer: `Žák popíše nebo nakreslí, co téma znamená. Hodnotí se porozumění, ne odborná terminologie.` },
        { question: `Kde v přírodě nebo v těle najdeme „${topic}"?`, answer: `Žák uvede konkrétní místo výskytu. Hodnotí se znalost biologického kontextu.` },
        { question: `Proč je „${topic}" pro živé organismy důležité? Co by se stalo bez něho?`, answer: `Žák vysvětlí biologický význam vlastními slovy. Hodnotí se logické uvažování.` },
        { question: `Jaká zvířata nebo rostliny mají „${topic}"? Uveď příklady.`, answer: `Žák uvede alespoň jeden příklad organismu. Hodnotí se aplikace znalostí na reálné organismy.` },
        { question: `Co tě na tématu „${topic}" nejvíce zaujalo?`, answer: `Žák sdílí osobní reflexi. Hodnotí se zájem a angažovanost. Správná odpověď neexistuje.` },
      ],
      [
        { question: `Definujte pojem „${topic}" a zařaďte ho do biologické hierarchie.`, answer: `Žák uvede definici a správně téma zařadí (buňka/tkáň/orgán/organismus/ekosystém). Hodnotí se přesnost a zařazení.` },
        { question: `Popište strukturu nebo průběh jevu „${topic}" — jaké jsou jeho základní části nebo fáze?`, answer: `Žák popíše klíčové složky ve správném pořadí. Hodnotí se úplnost a věcná správnost.` },
        { question: `Jaký je biologický nebo ekologický přínos tématu „${topic}" pro organismus?`, answer: `Žák vysvětlí funkci v biologickém kontextu. Hodnotí se schopnost systémového myšlení.` },
        { question: `Co se stane, pokud téma „${topic}" přestane správně fungovat? Uveďte příklad.`, answer: `Žák popíše věrohodné důsledky poruchy. Hodnotí se logické myšlení a propojení znalostí.` },
        { question: `Jak téma „${topic}" souvisí s evolucí nebo adaptacemi organismů?`, answer: `Žák propojí jev s evoluční biologií. Hodnotí se schopnost abstraktního myšlení.` },
      ],
      [
        { question: `Definujte téma „${topic}" přesně v biologické terminologii a zařaďte ho na správnou úroveň biologické organizace.`, answer: `Žák uvede vědecky přesnou definici a správně zasadí téma do biologické hierarchie. Hodnotí se terminologická přesnost.` },
        { question: `Analyzujte strukturu a funkci „${topic}" — jak spolu struktura a funkce souvisejí?`, answer: `Žák propojí morfologii s funkcí a vysvětlí kauzální vztah. Hodnotí se analytické biologické myšlení.` },
        { question: `Jaký je evoluční a ekologický přínos tématu „${topic}"? Jak přispělo k úspěchu organismu?`, answer: `Žák propojí jev s evolučními a ekologickými principy. Hodnotí se syntetické myšlení.` },
        { question: `Navrhněte vědeckou hypotézu a experimentální design k ověření jednoho aspektu tématu „${topic}".`, answer: `Žák formuluje testovatelnou hypotézu a navrhne vhodný experiment. Hodnotí se vědecké myšlení a metodologická správnost.` },
        { question: `Jak téma „${topic}" ovlivňuje nebo se prolíná s aktuálními biologickými nebo environmentálními výzvami?`, answer: `Žák propojí téma s aktuálními vědeckými nebo environmentálními otázkami. Hodnotí se přesah a kritické myšlení.` },
      ]
    ),
  }
}

// ── PHYSICS ──────────────────────────────────────────────────────────────────

function buildPhysics(topic: string, t: ReturnType<typeof timeSplit>, grade: string): GenerationResult {
  const cat = getGradeCategory(grade)
  return {
    subject: 'physics', subjectLabel: 'Fyzika', gradeCategory: cat,
    lessonPlan: {
      uvod: pick(cat,
        `Úvod (${t.intro} min): Učitel předvede jednoduchý pokus nebo ukáže jev spojený s tématem „${topic}" z každodenního života. Žáci pozorují a hádjí, co se děje. Cíle jsou sděleny jednoduše.`,
        `Úvod (${t.intro} min): Učitel popíše nebo ukáže jev „${topic}" a ptá se: „Proč se to děje?" Žáci navrhují intuitivní vysvětlení. Cíle hodiny jsou formulovány jako fyzikální otázky.`,
        `Úvod (${t.intro} min): Učitel předloží fyzikální paradox nebo inženýrský problém vyžadující znalost tématu „${topic}". Žáci diskutují o přístupu. Cíle jsou formulovány akademicky s důrazem na matematický popis.`
      ),
      aktivizace: pick(cat,
        `Aktivizace (${t.activ} min): Žáci předpoví výsledek jednoduchého pokusu spojeného s tématem „${topic}". Předpovědi jsou zaznamenány — budou porovnány se skutečností. Opakování jednoduchých pojmů z předchozí hodiny.`,
        `Aktivizace (${t.activ} min): Žáci si vybavují fyzikální pojmy a zákony, na které téma „${topic}" navazuje. Učitel je zapisuje na tabuli a propojuje. Proběhne skupinová předpověď výsledku demonstrace.`,
        `Aktivizace (${t.activ} min): Žáci samostatně vyřeší jeden propedeutický příklad z předchozí látky a vyhodnotí správnost. Proběhne rychlá diskuse o strategiích. Propojení s tématem „${topic}".`
      ),
      hlavniCast: pick(cat,
        `Hlavní část (${t.main} min): Výklad tématu „${topic}" pomocí jednoduchých pokusů a modelů. Učitel pojmenovává a ukazuje — žáci opakují. Pracovní list s obrázky a doplňovacími cvičeními. Ústní shrnutí klíčového jevu.`,
        `Hlavní část (${t.main} min): Výklad tématu „${topic}" s definicí, vzorcem a jednotkou. Učitel řeší vzorový příklad krok za krokem. Žáci řeší příklady ve dvojicích. Proběhne demonstrace nebo jednoduchý experiment.`,
        `Hlavní část (${t.main} min): Formální výklad tématu „${topic}" s odvozením vzorce a fyzikální interpretací. Žáci řeší numerické příklady samostatně a ve skupinách diskutují o různých přístupech. Je navržen a rozebrán laboratorní experiment nebo simulace.`
      ),
      shrnuti: pick(cat,
        `Shrnutí (${t.summary} min): Žáci ústně popíší jev „${topic}" jednou větou. Opakování pojmů hrou „Co je to?" Propojení s každodenním životem.`,
        `Shrnutí (${t.summary} min): Žáci zopakují vzorec a jednotky pro téma „${topic}". Učitel zadá jeden exit příklad. Propojení s technickými aplikacemi.`,
        `Shrnutí (${t.summary} min): Žáci bez pomůcek zapíší definici, vzorec a limitace platnosti tématu „${topic}". Krátká diskuse o inženýrských aplikacích. Propojení s budoucí látkou.`
      ),
    },
    quiz: pickQuiz(cat,
      [
        { question: `Co je „${topic}"? Popiš vlastními slovy nebo nakresli.`, answer: `Žák popíše nebo nakreslí fyzikální jev jednoduše. Hodnotí se porozumění, ne odborná terminologie.` },
        { question: `Kde v životě se setkáváme s jevem „${topic}"? Dej příklad.`, answer: `Žák uvede jeden konkrétní příklad z každodenního života. Hodnotí se propojení fyziky s realitou.` },
        { question: `Co se stane, když… [jednoduchá situace spojená s tématem „${topic}"]?`, answer: `Žák popíše výsledek situace. Hodnotí se fyzikální intuice přiměřená věku.` },
        { question: `Jakou pomůcku nebo předmět bychom mohli použít při pokusu o tématu „${topic}"?`, answer: `Žák navrhne vhodnou pomůcku. Hodnotí se praktické myšlení a zájem o experiment.` },
        { question: `Co tě na tématu „${topic}" nejvíce zaujalo?`, answer: `Žák sdílí reflexi. Hodnotí se zájem. Správná odpověď neexistuje.` },
      ],
      [
        { question: `Definujte fyzikální veličinu nebo jev „${topic}" a uveďte jeho jednotku.`, answer: `Žák uvede přesnou definici a správnou SI jednotku. Hodnotí se věcná přesnost.` },
        { question: `Zapište vzorec pro „${topic}" a vysvětlete, co každý symbol znamená.`, answer: `Žák správně zapíše vzorec a popíše veličiny. Hodnotí se korektnost a porozumění.` },
        { question: `Popište fyzikální jev „${topic}" na příkladu z praxe nebo techniky.`, answer: `Žák uvede věcný příklad a propojí s fyzikálním principem. Hodnotí se srozumitelnost.` },
        { question: `Jaké veličiny ovlivňují „${topic}" a jakým způsobem?`, answer: `Žák popíše závislosti. Hodnotí se správnost a úplnost analýzy.` },
        { question: `Navrhněte jednoduchý pokus k demonstraci jevu „${topic}".`, answer: `Žák navrhne realizovatelný pokus. Hodnotí se kreativita a věcná správnost.` },
      ],
      [
        { question: `Definujte téma „${topic}" přesně a uveďte jeho matematický popis (vzorec, diferenciální rovnice, zákon).`, answer: `Žák uvede přesnou fyzikální definici a matematický zápis. Hodnotí se odborná korektnost.` },
        { question: `Odvoďte klíčový vzorec pro téma „${topic}" z prvních principů nebo z jiných fyzikálních zákonů.`, answer: `Žák ukáže matematické odvození. Hodnotí se schopnost fyzikální argumentace.` },
        { question: `Analyzujte závislosti veličin v rámci tématu „${topic}". Kde platí lineární vztah a kde ne?`, answer: `Žák identifikuje lineární a nelineární závislosti. Hodnotí se analytická hloubka.` },
        { question: `Navrhněte laboratorní experiment k ověření jednoho aspektu tématu „${topic}": hypotéza, postup, měřené veličiny, zdroje chyb.`, answer: `Žák navrhne komplexní experiment. Hodnotí se vědecká metodologie a fyzikální myšlení.` },
        { question: `Jaké jsou technické aplikace tématu „${topic}"? Uveďte alespoň dvě a vysvětlete fyzikální principy.`, answer: `Žák uvede aplikace s fyzikálním zdůvodněním. Hodnotí se přesah fyziky do inženýrské praxe.` },
      ]
    ),
  }
}

// ── REMAINING SUBJECTS (grade-aware) ──────────────────────────────────────────

function buildGenericSubject(
  topic: string, t: ReturnType<typeof timeSplit>, grade: string,
  subject: SubjectArea, subjectLabel: string,
  introVerb: string, activMethod: string, mainMethod: string, quizTheme: string
): GenerationResult {
  const cat = getGradeCategory(grade)
  const complexity = pick(cat,
    'jednoduchými příklady a obrázky, přiměřenými věku žáků',
    'skupinovou prací a názornými pomůckami',
    'analytickými úkoly a primárními zdroji'
  )
  const assessment = pick(cat,
    'jednoduchými ústními otázkami a hrou',
    'řízeným rozhovorem a větovými rámci',
    'metodou 3–2–1 a badatelskými otázkami'
  )
  return {
    subject, subjectLabel, gradeCategory: cat,
    lessonPlan: {
      uvod: `Úvod (${t.intro} min): Učitel zahájí hodinu ${introVerb} k tématu „${topic}". Žáci sdílejí první asociace a hypotézy. Cíle hodiny jsou formulovány jasně a přiměřeně pro ${grade}.`,
      aktivizace: `Aktivizace (${t.activ} min): ${activMethod} k tématu „${topic}". Žáci pracují individuálně nebo ve dvojicích, výstupy jsou sdíleny s třídou. Učitel propojí stávající znalosti s novou látkou.`,
      hlavniCast: `Hlavní část (${t.main} min): Systematický výklad tématu „${topic}" ${complexity}. Učitel střídá výklad s řízenými aktivitami. ${mainMethod}. Klíčové pojmy jsou průběžně zaznamenávány a vysvětlovány.`,
      shrnuti: `Shrnutí (${t.summary} min): Společné opakování hlavních poznatků o tématu „${topic}" ${assessment}. Každý žák formuluje jeden klíčový poznatek. Propojení s praxí a případné zadání domácího úkolu.`,
    },
    quiz: pickQuiz(cat,
      [
        { question: `Co je „${topic}"? Vysvětli vlastními slovy.`, answer: `Žák vlastními slovy popíše podstatu tématu. Hodnotí se porozumění, ne terminologie.` },
        { question: `Kde nebo kdy se s tématem „${topic}" setkáváme v životě?`, answer: `Žák uvede praktický příklad. Hodnotí se propojení s realitou.` },
        { question: `Co se ti na tématu „${topic}" zdá nejdůležitější?`, answer: `Žák identifikuje hlavní myšlenku. Hodnotí se porozumění a schopnost prioritizace.` },
        { question: `Zkus vysvětlit téma „${topic}" mladšímu sourozenci.`, answer: `Žák zjednoduší a zpřístupní téma. Hodnotí se hloubka porozumění.` },
        { question: `Co by ses ještě rád(a) dozvěděl(a) o tématu „${topic}"?`, answer: `Žák formuluje otázku. Hodnotí se zvídavost a aktivní zájem.` },
      ],
      [
        { question: `Definujte pojem „${topic}" v kontextu ${quizTheme}.`, answer: `Žák uvede přesnou definici. Hodnotí se správnost a srozumitelnost.` },
        { question: `Uveďte příklad, kde se téma „${topic}" prakticky využívá nebo vyskytuje.`, answer: `Žák uvede věcně správný příklad. Hodnotí se propojení teorie s praxí.` },
        { question: `Jaké jsou hlavní rysy nebo součásti tématu „${topic}"?`, answer: `Žák identifikuje klíčové složky. Hodnotí se úplnost a analytické myšlení.` },
        { question: `Jak byste téma „${topic}" vysvětlili spolužákovi, který chyběl?`, answer: `Žák prokáže hloubku porozumění. Hodnotí se srozumitelnost a úplnost.` },
        { question: `Proč je téma „${topic}" důležité? Zdůvodněte svůj názor.`, answer: `Žák formuluje a zdůvodní postoj. Hodnotí se argumentace a věcnost.` },
      ],
      [
        { question: `Analyzujte téma „${topic}" — definujte, zasaďte do kontextu a zhodnoťte jeho přínos.`, answer: `Žák provede komplexní analýzu. Hodnotí se hloubka, správnost a kritické myšlení.` },
        { question: `Jaké jsou různé perspektivy nebo přístupy k tématu „${topic}"? Porovnejte je.`, answer: `Žák identifikuje různé úhly pohledu. Hodnotí se schopnost komparace.` },
        { question: `Jaká jsou případná omezení, rizika nebo kontroverze spojené s tématem „${topic}"?`, answer: `Žák identifikuje kritická místa. Hodnotí se kritické a analytické myšlení.` },
        { question: `Jak téma „${topic}" navazuje na širší kontext ${quizTheme}? Uveďte konkrétní propojení.`, answer: `Žák vytvoří systémové propojení. Hodnotí se šíře přehledu a syntetické myšlení.` },
        { question: `Jaký je přesah tématu „${topic}" do současnosti nebo budoucnosti?`, answer: `Žák propojí téma s aktuálním světem. Hodnotí se schopnost přenosu a kritické myšlení.` },
      ]
    ),
  }
}

// ── BUILDERS MAP ─────────────────────────────────────────────────────────────

const BUILDERS: Record<SubjectArea, (topic: string, t: ReturnType<typeof timeSplit>, grade: string) => GenerationResult> = {
  history:    buildHistory,
  math:       buildMath,
  biology:    buildBiology,
  physics:    buildPhysics,
  chemistry:  (t, ti, g) => buildGenericSubject(t, ti, g, 'chemistry', 'Chemie',
    'ukázkou chemické látky nebo reakce spojenou',
    'Žáci si vybavují chemické pojmy a látky, které s tématem souvisí',
    'Výklad zahrnuje strukturu, vlastnosti, rovnice a praktické využití tématu',
    'chemie'
  ),
  literature: (t, ti, g) => buildGenericSubject(t, ti, g, 'literature', 'Literatura / ČJ',
    'přečtením ukázky nebo popisem literárního kontextu spojeného',
    'Žáci sdílejí znalosti o autorovi, epoše nebo žánru tématu',
    'Analýza textu zahrnuje kompozici, jazykové prostředky, témata a kulturní kontext tématu',
    'literatury a jazyka'
  ),
  geography:  (t, ti, g) => buildGenericSubject(t, ti, g, 'geography', 'Zeměpis',
    'zobrazením mapy nebo fotografie místa spojeného',
    'Žáci lokalizují téma na mapě a sdílejí znalosti o dané oblasti',
    'Výklad pokrývá fyzickogeografické i socioekonomické aspekty tématu',
    'zeměpisu'
  ),
  civics:     (t, ti, g) => buildGenericSubject(t, ti, g, 'civics', 'Občanská výchova',
    'aktuální kauzou nebo právním případem spojeným',
    'Žáci sdílejí znalosti z médií nebo každodenního života o tématu',
    'Výklad zahrnuje právní rámec, práva, povinnosti a institucionální ochranu spojenou s tématem',
    'práva a společnosti'
  ),
  general:    (t, ti, g) => buildGenericSubject(t, ti, g, 'general', 'Obecný předmět',
    'motivační otázkou nebo zajímavostí spojenou',
    'Žáci formují myšlenkovou mapu k tématu',
    'Výklad postupuje od obecného ke konkrétnímu se střídáním metod',
    'daného oboru'
  ),
}

// ── Random topic suggestions ──────────────────────────────────────────────────

export const RANDOM_TOPICS: Record<SubjectArea, string[]> = {
  history: ['Francouzská revoluce', 'Husitství', 'Druhá světová válka', 'Sametová revoluce', 'Starověký Řím', 'Napoleonské války', 'Studená válka'],
  math: ['Pythagorova věta', 'Kvadratické rovnice', 'Pravděpodobnost', 'Podobnost trojúhelníků', 'Lineární funkce', 'Výpočet procent', 'Objem tělesa'],
  physics: ['Newtonovy zákony pohybu', 'Elektrický obvod', 'Gravitační síla', 'Zvuk a jeho vlastnosti', 'Světlo a optika', 'Magnetismus', 'Tepelná výměna'],
  biology: ['Fotosyntéza', 'Buněčné dělení', 'Ekosystém lesa', 'Lidský oběhový systém', 'Evoluce a přírodní výběr', 'Genetika a dědičnost', 'Imunitní systém'],
  chemistry: ['Kyseliny a zásady', 'Oxidace a redukce', 'Periodická tabulka prvků', 'Organické sloučeniny', 'Chemické rovnice', 'pH roztoků', 'Elektrolýza'],
  literature: ['Máj – Karel Hynek Mácha', 'Osudy dobrého vojáka Švejka', 'Romeo a Julie', 'Krátké prózy Franze Kafky', 'Neruda – Povídky malostranské', 'Hamlet', 'Malý princ'],
  geography: ['Alpy a jejich vliv na klima', 'Amazonie – největší deštný prales', 'Japonsko – kultura a příroda', 'Afriká Sahara', 'Skandinávie', 'Česká republika – kraj', 'Antarktida'],
  civics: ['Ústava České republiky', 'Lidská práva a jejich ochrana', 'Demokratické volby', 'Soudní systém ČR', 'Práva a povinnosti žáka', 'Evropská unie', 'Mediální gramotnost'],
  general: ['Klimatická změna', 'Umělá inteligence', 'Zdravý životní styl', 'Globalizace', 'Podnikání a ekonomika', 'Digitální bezpečnost', 'Etika v moderním světě'],
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateMaterials(topic: string, grade: string, duration: number): GenerationResult {
  const subject = detectSubject(topic)
  const t = timeSplit(duration)
  return BUILDERS[subject](topic, t, grade)
}

export function getSubjectLabel(subject: SubjectArea): string {
  return SUBJECT_LABELS[subject]
}
