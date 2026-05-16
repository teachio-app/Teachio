import { NextRequest, NextResponse } from 'next/server'

// Node.js runtime required — pdf-parse uses Node-only internals
export const runtime = 'nodejs'

const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20 MB

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
    return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 413 })
  }

  const fileName = (file as File).name ?? ''
  const isPDF = file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
  if (!isPDF) {
    return NextResponse.json({ error: 'Only PDF files are accepted by this endpoint' }, { status: 415 })
  }

  // ── Convert to Buffer ──────────────────────────────────────────────────────
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // ── Parse with pdf-parse v2 (class-based API) ──────────────────────────────
  try {
    const { PDFParse } = await import('pdf-parse')

    const parser = new PDFParse({ data: buffer, verbosity: 0 })
    const result = await parser.getText()
    await parser.destroy()

    const text = result.text?.trim() ?? ''

    if (!text) {
      return NextResponse.json(
        { error: 'No text could be extracted. The PDF may be image-only (scanned) or password-protected.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      text,
      pages:  result.numpages,
      chars:  text.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[parse-pdf] Error:', message)
    return NextResponse.json(
      { error: `PDF parsing failed: ${message}` },
      { status: 500 }
    )
  }
}
