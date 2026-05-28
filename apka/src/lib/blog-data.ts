export type BlogSection =
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'tip'; label: string; text: string }
  | { type: 'ol'; items: string[] }

export interface BlogArticle {
  title: string
  slug: string
  excerpt: string
  tag: string
  tagColor: string
  author: string
  date: string
  readTime: string
  accentColor: string
  accentBg: string
  coverEmoji: string
  coverGradient: string
  sections: BlogSection[]
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    title: '5 triků, jak se učit půl času a pamatovat dvojnásob',
    slug: '5-triku-jak-se-ucit',
    excerpt: 'Pomodoro pro moderní éru, spaced repetition v praxi a proč podcast funguje líp než zvýrazňovač.',
    tag: 'Tipy',
    tagColor: '#a78bfa',
    author: 'Petr Pech',
    date: '12. května 2026',
    readTime: '6 min',
    accentColor: '#a78bfa',
    accentBg: 'rgba(124,58,237,0.10)',
    coverEmoji: '🧠',
    coverGradient: 'linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)',
    sections: [
      { type: 'p', text: 'Každý student zná ten pocit — hodiny u knih, zvýrazňovač vybarvený do půlky, ale pak u zkoušky prázdno. Problém není v množství učení. Problém je v tom, jak učíme.' },
      { type: 'h2', text: '1. Pomodoro pro generaci AI' },
      { type: 'p', text: 'Klasická Pomodoro technika říká: 25 minut práce, 5 minut pauza. Funguje, ale má háček — přerušení po 25 minutách může roztrhnout tok myšlenek přesně ve chvíli, kdy to začíná dávat smysl.' },
      { type: 'p', text: 'Moderní varianta: nech AI vygenerovat studijní materiál (kvíz, flashkarty, podcast) a pak mu věnuj jeden soustředěný blok 40–50 minut. Pak pauzu. Pak dalši blok s novým materiálem. Učení má strukturu a ty neřešíš, co dělat dál.' },
      { type: 'tip', label: '💡 Tip', text: 'Před blockem si napiš na papír jednu větu: "Dnes se naučím X." Pomáhá to mozku soustředit se na cíl, ne na hodiny.' },
      { type: 'h2', text: '2. Spaced repetition v praxi' },
      { type: 'p', text: 'Spaced repetition — opakovat informaci ve stále delších intervalech — je jednou z nejlépe prokázaných technik učení. Problém je, že komerční appky jako Anki vyžadují přípravu desítek karet, než se vůbec začneš učit.' },
      { type: 'p', text: 'Teachio tohle řeší jinak: flashkarty se generují automaticky z tvého tématu nebo zápisků. Neplýtváš 30 minut přípravou. Rovnou se učíš.' },
      { type: 'ul', items: ['Projdi karty první den tématu.', 'Opakuj za 1 den, pak za 3 dny, pak za týden.', 'Karty, které ti plavou, Teachio vrátí dřív.'] },
      { type: 'h2', text: '3. Podcast místo přepisování' },
      { type: 'p', text: 'Výzkumy z Princetonu ukazují, že ruční psaní nás nutí parafrazovat — a to zlepšuje porozumění. Přepisování hotových zápisků ale funguje opačně: jen přesouváme text, aniž bychom ho zpracovávali.' },
      { type: 'p', text: 'Výukový podcast je jiný příběh. Posloucháš dialog, mozek aktivně sleduje, kde se hosté shodují a kde neshodují. Výzkum z MIT naznačuje, že konverzační formát zvyšuje retenci o až 40 % oproti pasivnímu čtení.' },
      { type: 'quote', text: '"Nejefektivnější učení není přijímat informace — je to bojovat s nimi. Podcast tě nutí přemýšlet, ne jen číst."' },
      { type: 'h2', text: '4. Nastav si termín a drž se ho' },
      { type: 'p', text: 'Mozek potřebuje deadline. Ne vágní "zkouška někdy v červnu", ale konkrétní datum s počítadlem dní. Teachio studijní plán toto dělá automaticky — zadáš datum, dostaneš plán den po dni.' },
      { type: 'p', text: 'Klíčový detail: plán musí být zvladatelný. Pokud ti den uteče, plán se automaticky přizpůsobí. Žádný pocit viny, jen posun o den.' },
      { type: 'h2', text: '5. Když to nejde, je to normální' },
      { type: 'p', text: 'Největší nepřítel studia není lenost — je to perfekcionismus. "Nestihnu se naučit vše, tak nezačnu vůbec." Tenhle vzorec zná každý student.' },
      { type: 'p', text: 'Řešení: nastav si minimální denní cíl — třeba jen 15 minut. Pokud uděláš víc, bonus. Pokud ne, aspoň jsi nezačal nulou. Série malých vítězství buduje impulz. A impulz je lepší než vůle.' },
      { type: 'tip', label: '🎯 Shrnutí', text: 'Pomodoro + AI struktura, spaced repetition, podcast místo přepisování, pevný termín, a hlavně: konzistence nad dokonalostí.' },
    ],
  },
  {
    title: 'Jak jsem si zkrátil přípravu na maturitu o tři týdny',
    slug: 'zkratil-jsem-pripravu-na-maturitu',
    excerpt: 'Osobní příběh studenta SŠ, jeho rutina s Teachiem a konkrétní čísla — kolik kapitol, kolik hodin, co by udělal jinak.',
    tag: 'Příběhy',
    tagColor: '#f472b6',
    author: 'Petr Pech',
    date: '3. května 2026',
    readTime: '7 min',
    accentColor: '#f472b6',
    accentBg: 'rgba(219,39,119,0.08)',
    coverEmoji: '🎓',
    coverGradient: 'linear-gradient(135deg,#4a1942,#7c1d6f,#a21caf)',
    sections: [
      { type: 'p', text: 'V březnu jsem měl biologii. Dvě hodiny týdně, čtyři roky látky, a já jsem se na ni začal učit pět týdnů předem. Pro někoho pozdě, pro mě záchrana.' },
      { type: 'h2', text: 'Výchozí bod: kaos' },
      { type: 'p', text: 'Moje zápisky z biologie byly katastrofa. Čtyři různé sešity, pár odfocených tabulí, pár zvýrazněných stránek v učebnici. Nic propojeného. Nevěděl jsem, kde začít.' },
      { type: 'p', text: 'Zkusil jsem Teachio na doporučení spolužáka. Nahral jsem první sešit jako PDF a nechal vygenerovat chytré výpisky. Trvalo to 12 vteřin. Dostal jsem TL;DR, klíčová fakta, chytáky a mnemotechniku.' },
      { type: 'quote', text: '"Najednou jsem věděl, co vím a co nevím. Tohle samo o sobě stálo za víc než hodina studia."' },
      { type: 'h2', text: 'Rutina, která fungovala' },
      { type: 'p', text: 'Každý den jsem si nastavil jedno téma. Postup byl vždy stejný:' },
      { type: 'ol', items: [
        'Vygenerovat výpisky z tématu nebo zápisků (2 min).',
        'Přečíst TL;DR a klíčová fakta (5 min).',
        'Poslechnout podcast při snídani nebo cestou (7–10 min).',
        'Udělat kvíz — 5 otázek, okamžité vysvětlení (5–8 min).',
        'Flashkarty před spaním — 10 karet, 2× otočit (10 min).',
      ] },
      { type: 'p', text: 'Celkem: 25–35 minut na téma. Zvládl jsem 3 témata denně. Za 5 týdnů to bylo 105 témat.' },
      { type: 'h2', text: 'Konkrétní čísla' },
      { type: 'ul', items: [
        '5 týdnů přípravy (35 dní, z toho 5 volných).',
        '87 témat zvládnutých přes Teachio.',
        'Průměrně 52 minut učení denně.',
        '3 celkové opakování pomocí studijního plánu.',
        'Výsledek maturity: jedničky z biologie i chemie.',
      ] },
      { type: 'h2', text: 'Co bych udělal jinak' },
      { type: 'p', text: 'Začal bych dřív. Ne proto, že jsem to nestihl — ale proto, že 5 týdnů bylo intenzivních. S 8 týdny by bylo volněji a paměť by pracovala méně pod tlakem.' },
      { type: 'p', text: 'Víc bych také využíval hru. Párování pojmů se mi zdálo jako zbytečná "hračka", ale když jsem to zkusil na evoluci, zapamatoval jsem si vazby mnohem rychleji než z textu.' },
      { type: 'tip', label: '📌 Klíčové ponaučení', text: 'Systém beats chaos. I špatný systém je lepší než žádný. Teachio dal mé přípravě strukturu — a to byl největší rozdíl.' },
    ],
  },
  {
    title: 'Proč klasické zápisky nestačí (a co s tím)',
    slug: 'proc-klasicke-zapisky-nestaci',
    excerpt: 'Výzkumy o aktivním vybavování, proč číst znovu je past, a jak Teachio mění pasivní text v aktivní materiál.',
    tag: 'Studium',
    tagColor: '#34d399',
    author: 'Jakub Hradecký',
    date: '24. dubna 2026',
    readTime: '5 min',
    accentColor: '#34d399',
    accentBg: 'rgba(5,150,105,0.08)',
    coverEmoji: '📚',
    coverGradient: 'linear-gradient(135deg,#064e3b,#065f46,#047857)',
    sections: [
      { type: 'p', text: 'Projít zápisky znovu a znovu — tohle dělá většina studentů před zkouškou. Je to pohodlné. Přijde nám, že to funguje. Ve skutečnosti je to jedna z nejméně efektivních technik učení vůbec.' },
      { type: 'h2', text: 'Iluze plynulosti' },
      { type: 'p', text: 'Když znovu čteme text, který jsme viděli, mozek ho zpracovává jako "povědomé" — a tuto povědomost si pleteme se znalostí. Výzkumníci z University of Washington tomu říkají "fluency illusion" — iluze plynulosti.' },
      { type: 'p', text: 'Výsledek: zdá se nám, že látku umíme, ale při zkoušce, kde není text k dispozici, selháváme. Zápisky nám v hlavě zůstaly jako obrázek, ne jako vybavitelná informace.' },
      { type: 'quote', text: '"Čtení zápisků je jako koukat na fotku plavání a myslet si, že umíš plavat."' },
      { type: 'h2', text: 'Aktivní vybavování: jiný přístup' },
      { type: 'p', text: 'Efektivní učení funguje opačně: místo čtení textu se snažíš informaci vybavit bez pomoci. Tento princip — nazývaný "retrieval practice" — zvyšuje retenci o 40–60 % oproti opakovanému čtení (studie: Roediger & Karpicke, 2006).' },
      { type: 'ul', items: [
        'Místo čtení zápisků: dej zápisky stranou a napiš vše, co si pamatuješ.',
        'Místo zvýrazňování: polož si otázky k odstavcům.',
        'Místo opakování: udělej kvíz — bez podívání na odpovědi.',
      ] },
      { type: 'h2', text: 'Jak to funguje v Teachiu' },
      { type: 'p', text: 'Teachio tenhle princip automatizuje. Z tvého textu nebo tématu okamžitě generuje kvíz (5 otázek, okamžité vysvětlení), flashkarty (pojmová karta → definice po otočení) a výpisky strukturované jako "klíčové fakty k vybavení".' },
      { type: 'p', text: 'Nejde jen o přeformátování textu. Jde o přeměnu pasivního materiálu v aktivní výzvu pro mozek.' },
      { type: 'h2', text: 'Proč podcast?' },
      { type: 'p', text: 'Podcast přidává ještě jeden rozměr: konverzaci. Sledovat dialog dvou postav, z nichž jedna "neví" a druhá vysvětluje, zapojuje jiné části mozku než čtení. Musíš sledovat logiku argumentace, ne jen fakta.' },
      { type: 'p', text: 'Výzkumy z MIT naznačují, že narativní formát zvyšuje zapamatovatelnost emočně relevantních informací. Příběh ve studiu funguje lépe než výčet bodů.' },
      { type: 'tip', label: '🔬 Vědecké shrnutí', text: 'Nejefektivnější technika: retrieval practice (kvíz, flashkarty) + spaced repetition (opakování v intervalech) + elaborative interrogation (ptát se PROČ). Teachio tohle dává do jednoho balíčku.' },
    ],
  },
  {
    title: 'Učitel a AI: spojenec, ne nepřítel',
    slug: 'ucitel-a-ai-spojenec',
    excerpt: 'Jak učitelé používají Teachio v hodině, příklady aktivit do 10 minut, a jak rozeznat AI obsah od poctivého učení.',
    tag: 'Pro učitele',
    tagColor: '#60a5fa',
    author: 'Petr Pech',
    date: '15. dubna 2026',
    readTime: '6 min',
    accentColor: '#60a5fa',
    accentBg: 'rgba(37,99,235,0.08)',
    coverEmoji: '👩‍🏫',
    coverGradient: 'linear-gradient(135deg,#1e3a5f,#1d4ed8,#2563eb)',
    sections: [
      { type: 'p', text: 'Každý učitel zná ten moment: zmíníš AI a polovina třídy se zamračí (nebo se zachechce). Ostatní učitelé, kteří o AI slyšeli, buď propadají panice, nebo mají tendenci ho zcela ignorovat. Ani jeden přístup nefunguje.' },
      { type: 'h2', text: 'AI ve třídě: co to skutečně znamená' },
      { type: 'p', text: 'AI v hodině neznamená, že studenti dostanou hotové odpovědi. Znamená to, že mají lepší a rychlejší přístup k lešení — strukturám, příkladům, vysvětlením — které jim pomáhají pochopit látku na hlubší úrovni.' },
      { type: 'p', text: 'Teachio je navržený tak, aby generoval materiál, který nutí studenty přemýšlet — ne jen kopírovat. Kvíz s vysvětlením po každé odpovědi, flashkarty, které student musí aktivně otočit, podcast jako úvod do diskuse.' },
      { type: 'h2', text: 'Aktivity do 10 minut' },
      { type: 'ul', items: [
        '📝 Warm-up kvíz: Zadej téma, nech Teachio vygenerovat 5 otázek. Studenti odpovídají a hned vidí, co ještě nevědí.',
        '🎧 Podcast jako intro: Pusť 5-minutový podcast na začátek hodiny. Studenti pak diskutují, co slyšeli.',
        '🃏 Exit ticket: Každý student před koncem hodiny projde 3 flashkarty a řekne, která se mu zdála nejtěžší.',
        '🕹️ Párování: Hra na spojování pojmů s definicemi — vhodná jako procvičení po výkladu.',
      ] },
      { type: 'h2', text: 'Jak rozeznat AI od skutečné práce' },
      { type: 'p', text: 'Největší obava učitelů: "Studenti mi odevzdají AI text a budou tvrdit, že je jejich." Tohle je reálný problém — ale Teachio ho řeší jinak. Místo textového výstupu, který lze odevzdat, jsou výstupy interaktivní (kvíz, hra, flashkarty).' },
      { type: 'p', text: 'Pro psané výstupy platí stará dobrá metoda: požaduj zdůvodnění, kontext a propojení s probíranou látkou. Univerzální AI text tenhle test neprůchází.' },
      { type: 'quote', text: '"AI je nejlépe jako partner na procvičování. Student, který projde 20 flashkartami s vysvětlením, se naučí víc než ten, kdo si přečetl Wikipedia."' },
      { type: 'h2', text: 'Teachio a učitelé' },
      { type: 'p', text: 'Plánujeme specializované funkce pro učitele: sdílené studijní plány pro celou třídu, anonymizované výsledky kvízů pro přehled, kde třída zaostává, a generování materiálů ze školních osnov.' },
      { type: 'p', text: 'Máš zájem o pilotní program? Napiš nám na hello@teachio.cz.' },
      { type: 'tip', label: '✅ Pro učitele', text: 'Nejlepší způsob, jak začít: vezmi jedno téma z příští hodiny, nech Teachio vygenerovat kvíz a flashkarty, a použij je jako warm-up nebo exit ticket. Zabere to 5 minut přípravy.' },
    ],
  },
  {
    title: 'Studijní plán: kalendář, který se sám přizpůsobí',
    slug: 'studijni-plan-ktery-se-prizpusobi',
    excerpt: 'Představení /studijni-plan route — jak nastavit termín, jak Teachio reaguje, když jeden den vypadneš.',
    tag: 'Novinky',
    tagColor: '#fbbf24',
    author: 'tým Teachio',
    date: '5. května 2026',
    readTime: '4 min',
    accentColor: '#fbbf24',
    accentBg: 'rgba(245,158,11,0.08)',
    coverEmoji: '📅',
    coverGradient: 'linear-gradient(135deg,#451a03,#92400e,#b45309)',
    sections: [
      { type: 'p', text: 'Plánování studia je jedna věc. Držet se plánu je druhá. Většina studentů zvládne první den — a pak se plán sesype jako domino, protože jeden den vypadli a nevěděli, jak pokračovat.' },
      { type: 'h2', text: 'Jak nový studijní plán funguje' },
      { type: 'p', text: 'Zadáš předmět nebo téma. Zadáš datum zkoušky. Vyberáš si, kolik máš denně čas — slider od 15 minut do 4 hodin. Volitelně nahraješ zápisky.' },
      { type: 'p', text: 'Teachio pak spočítá, kolik dní máš, rozdělí látku do fází (úvod, prohlubování, procvičení, opakování, finale) a přiřadí každému dni konkrétní úkol s odhadovaným časem.' },
      { type: 'ul', items: [
        'Každý den dostaneš jedno téma s konkrétním zadáním.',
        'Plán počítá s víkendy a tvým nastaveným rytmem.',
        'Pokud den vynecháš, plán se automaticky přepočítá.',
      ] },
      { type: 'h2', text: 'Inteligentní přizpůsobení' },
      { type: 'p', text: 'Tohle je místo, kde se Teachio liší od statické tabulky v Excelu. Pokud vynecháš den nebo nesplníš úkol, plán nezkolabuje — automaticky rozloží zbývající látku na zbývající dny a trochu zkrátí odhady.' },
      { type: 'p', text: 'Nikdy ti neukáže "jsi pozadu o 3 dny". Ukáže ti: "Tady je tvůj plán na dnes."' },
      { type: 'quote', text: '"Nejlepší plán je ten, který funguje i tehdy, když ho nedodržuješ dokonale."' },
      { type: 'h2', text: 'Dashboard, kam se vracíš' },
      { type: 'p', text: 'Po vygenerování plánu dostaneš dashboard s přehledem: kolik dní zbývá, dnešní úkol, týdenní rozvrh a seznam kapitol se statusy. Otevřeš ho ráno, víš přesně, co máš dělat.' },
      { type: 'tip', label: '🆕 Nové', text: 'Studijní plán je teď dostupný na /studijni-plan. Spusť ho přes hlavní navigaci nebo knoflík na dashboardu.' },
    ],
  },
  {
    title: '10 nejlepších témat na opakování před maturitou z biologie',
    slug: '10-temat-biologie-maturita',
    excerpt: '10 kapitol s odhadovaným časem a doporučenými nástroji Teachia (kvíz/podcast/flashkarty) ke každé.',
    tag: 'Studium',
    tagColor: '#34d399',
    author: 'Petr Pech',
    date: '28. dubna 2026',
    readTime: '5 min',
    accentColor: '#34d399',
    accentBg: 'rgba(5,150,105,0.08)',
    coverEmoji: '🧬',
    coverGradient: 'linear-gradient(135deg,#052e16,#14532d,#166534)',
    sections: [
      { type: 'p', text: 'Biologie u maturity pokrývá obrovské množství témat. Na co se soustředit? Připravili jsme přehled 10 kapitol, které se nejčastěji opakují v maturitních otázkách, s odhadovaným časem přípravy a doporučeným nástrojem Teachia.' },
      { type: 'h2', text: '1. Buňka a buněčné dělení — 90 minut' },
      { type: 'p', text: 'Základ základů. Rozdíl mezi prokaryotní a eukaryotní buňkou, mitóza vs. meióza, fáze buněčného cyklu. Učitelé milují chytáky o počtu chromosomů po meióze.' },
      { type: 'ul', items: ['🃏 Flashkarty: organely buňky a jejich funkce.', '🧩 Kvíz: fáze mitózy vs. meiózy.', '🎧 Podcast: buněčné dělení jako dvouhlasová show.'] },
      { type: 'h2', text: '2. Fotosyntéza a dýchání — 75 minut' },
      { type: 'p', text: 'Dva procesy, které si studenti pletou. Chloroplast vs. mitochondrie, světelná a temnostní fáze fotosyntézy, glykolýza, Krebsův cyklus. Věnuj čas rovnicím — ty jsou na maturitě jisté.' },
      { type: 'ul', items: ['🧩 Kvíz: vstupní a výstupní látky každého procesu.', '🃏 Flashkarty: enzymy a kde působí.'] },
      { type: 'h2', text: '3. Genetika — 120 minut' },
      { type: 'p', text: 'DNA, RNA, replikace, transkripce, translace. Mendelovy zákony a výjimky z nich. Genetické nemoci. Toto téma je rozsáhlé — věnuj mu nejvíc času.' },
      { type: 'ul', items: ['🎧 Podcast: centrální dogma molekulární biologie.', '🕹️ Hra: párování kodonů a aminokyselin.', '🧩 Kvíz: dědičnost krevních skupin.'] },
      { type: 'h2', text: '4. Evoluce — 60 minut' },
      { type: 'p', text: 'Darwinova teorie, přírodní výběr, speciace. Doklady evoluce — fosilní záznam, srovnávací anatomie, molekulární biologie. Čím dál víc se zkouší propojení s genetikou.' },
      { type: 'ul', items: ['🃏 Flashkarty: klíčové pojmy a osobnosti.', '🧩 Kvíz: příklady adaptací v přírodě.'] },
      { type: 'h2', text: '5. Ekologie — 45 minut' },
      { type: 'p', text: 'Ekosystémy, potravní řetězce, koloběhy látek (uhlík, dusík, voda). Lidský vliv na ekosystémy. Toto téma je zpravidla "bonusové" — ale lehce se připraví.' },
      { type: 'ul', items: ['🎧 Podcast: koloběh uhlíku a klimatická změna.', '🕹️ Hra: sestavení potravní pyramidy.'] },
      { type: 'h2', text: '6–10: Zbývající témata' },
      { type: 'ul', items: [
        '6. Fyziologie rostlin — fototropismus, hormonální regulace, rozmnožování (60 min).',
        '7. Fyziologie živočichů — nervová soustava, hormonální soustava, smyslové orgány (90 min).',
        '8. Imunita — specifická vs. nespecifická, očkování, alergie (45 min).',
        '9. Mikroorganismy — bakterie, viry, houby, jejich role a choroby (45 min).',
        '10. Systém a taxonomie — doménový systém, klíčové skupiny, latinské názvy (30 min).',
      ] },
      { type: 'tip', label: '📌 Doporučení', text: 'Začni tematikou, která ti jde nejhůř (pro většinu studentů: genetika nebo buněčné dělení). Záchrana na konec: ekologie a taxonomie — tam lze rychle "přidat body" kratší přípravou.' },
    ],
  },
]

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find(a => a.slug === slug)
}

export function getRelatedArticles(slug: string, tag: string): BlogArticle[] {
  return BLOG_ARTICLES.filter(a => a.slug !== slug && a.tag === tag).slice(0, 3)
}
