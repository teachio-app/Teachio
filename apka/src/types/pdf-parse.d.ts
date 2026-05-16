// pdf-parse v2 type declarations
declare module 'pdf-parse' {
  interface LoadParameters {
    /** URL to fetch the PDF from */
    url?: string | URL
    /** Raw PDF buffer */
    data?: Uint8Array | Buffer | ArrayBuffer
    /** Verbosity level (0 = silent) */
    verbosity?: number
    /** Password for encrypted PDFs */
    password?: string
  }

  interface TextResult {
    text: string
    numpages: number
    info: Record<string, unknown>
    metadata: unknown
    version: string
  }

  class PDFParse {
    constructor(params: LoadParameters)
    getText(params?: Record<string, unknown>): Promise<TextResult>
    getInfo(): Promise<Record<string, unknown>>
    destroy(): Promise<void>
  }

  const VerbosityLevel: { ERRORS: number; WARNINGS: number; INFOS: number }

  export { PDFParse, VerbosityLevel }
  export type { LoadParameters, TextResult }
}
