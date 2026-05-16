import type { LangCode } from './translations'

const LANG_NAMES: Record<LangCode, string> = {
  cz: 'Czech',
  en: 'English',
  de: 'German',
  fr: 'French',
}

const FILLERS: Partial<Record<LangCode, string>> = {
  en: " (e.g., 'Exactly', 'Right', 'So here's the thing', 'And get this')",
  de: " (e.g., 'Genau', 'Also', 'Weißt du', 'Das heißt', 'Stell dir vor')",
  fr: " (e.g., 'Voilà', 'Alors', 'Eh bien', 'Tu vois', 'Écoute')",
}

/**
 * Returns a mandatory language directive to append to any system prompt.
 * Returns an empty string for Czech (the default) to avoid unnecessary tokens.
 */
export function buildLangDirective(lang: LangCode | string | undefined): string {
  const code = (lang ?? 'cz') as LangCode
  if (!code || code === 'cz') return ''
  const name   = LANG_NAMES[code] ?? 'Czech'
  const filler = FILLERS[code] ?? ''

  return `

LANGUAGE DIRECTIVE — MANDATORY — HIGHEST PRIORITY:
① Generate ALL content (introductions, explanations, quiz questions, exam traps, memory hacks, audio/podcast scripts, synthesis paragraphs) strictly in ${name}.
② JSON keys MUST stay in English exactly as defined in the schema. Do NOT translate keys.
③ Audio/podcast tone: Use natural idioms and conversational fillers native to ${name}${filler}. The output must sound like a native speaker, not a translation.
④ Failure to comply with this directive = invalid output.`
}
