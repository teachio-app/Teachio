/**
 * Downloads an HTML string as a PDF file using html2pdf.js.
 * Dynamically imported so it never runs on the server.
 */
export async function downloadPdf(htmlContent: string, filename: string): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default

  const el = document.createElement('div')
  el.innerHTML = htmlContent
  el.style.cssText = 'position:absolute;left:-9999px;top:0;width:794px'
  document.body.appendChild(el)

  try {
    await html2pdf()
      .set({
        margin:      [12, 14, 12, 14],
        filename,
        image:       { type: 'jpeg', quality: 0.96 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:   { mode: ['avoid-all', 'css'] },
      })
      .from(el)
      .save()
  } finally {
    document.body.removeChild(el)
  }
}
