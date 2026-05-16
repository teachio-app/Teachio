declare module 'html2pdf.js' {
  interface Options {
    margin?: number | [number, number, number, number]
    filename?: string
    image?: { type?: string; quality?: number }
    html2canvas?: { scale?: number; useCORS?: boolean; logging?: boolean }
    jsPDF?: { unit?: string; format?: string; orientation?: string }
    pagebreak?: { mode?: string | string[] }
  }
  interface Instance {
    set(opts: Options): Instance
    from(src: HTMLElement): Instance
    save(): Promise<void>
  }
  function html2pdf(): Instance
  export = html2pdf
}
