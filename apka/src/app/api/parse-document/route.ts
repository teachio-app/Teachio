import { NextRequest, NextResponse } from 'next/server'

// Node.js runtime required — both pdf-parse and mammoth use Node-only internals.
// Both are listed in next.config.js serverExternalPackages to avoid bundling issues.
export const runtime = 'nodejs'

const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB

type DocType = 'pdf' | 'docx' | 'text'

const MIME_MAP: Record<string, DocType> = {
  'application/pdf':                                                          'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword':                                                       'docx',
  'text/plain':                                                               'text',
  'text/markdown':                                                            'text',
}

const EXT_MAP: Record<string, DocType> = {
  pdf:  'pdf',
  docx: 'docx',
  doc:  'docx',
  txt:  'text',
  md:   'text',
}

function detectType(fileName: string, mime: string): DocType | null {
  const byMime = MIME_MAP[mime]
  if (byMime) return byMime
  const ext = fileName.toLowerCase().split('.').pop() ?? ''
  return EXT_MAP[ext] ?? null
}

export async function POST(req: NextRequest) {
  // ── Parse multipart form ───────────────────────────────────────────────────
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File too large (max 25 MB)' }, { status: 413 })
  }

  const fileName = (file as File).name ?? ''
  const mime     = file.type ?? ''
  const docType  = detectType(fileName, mime)

  if (!docType) {
    return NextResponse.json(
      { error: 'Unsupported file type. Supported: PDF, DOCX, TXT, MD.' },
      { status: 415 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    let text = ''

    if (docType === 'pdf') {
      // pdf-parse v2 class-based API (dynamic import avoids bundling)
      const { PDFParse } = await import('pdf-parse')
      const parser = new PDFParse({ data: buffer, verbosity: 0 })
      const result = await parser.getText()
      await parser.destroy()
      text = result.text?.trim() ?? ''

    } else if (docType === 'docx') {
      // mammoth strips DOCX XML and returns clean plain text
      const mammoth = await import('mammoth')
      const result  = await mammoth.extractRawText({ buffer })
      text = result.value?.trim() ?? ''

    } else {
      // TXT / MD — read buffer directly as UTF-8
      text = buffer.toString('utf-8').trim()
    }

    if (!text) {
      return NextResponse.json(
        {
          error:
            docType === 'pdf'
              ? 'No text found. The PDF may be image-only (scanned) or password-protected.'
              : 'No text could be extracted from the document.',
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      text,
      chars:   text.length,
      docType,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[parse-document]', docType, msg)
    return NextResponse.json(
      { error: `Failed to parse document: ${msg}` },
      { status: 500 }
    )
  }
}
