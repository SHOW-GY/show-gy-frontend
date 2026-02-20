// src/types/declarations.d.ts

declare module "html2pdf.js" {
  {/*html2pdf.js의 타입 정의 */ }
  export interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      backgroundColor?: string | null;
      logging?: boolean;
      dpi?: number;
      letterRendering?: boolean;
      allowTaint?: boolean;
    };
    jsPDF?: {
      unit?: "pt" | "mm" | "cm" | "in" | "px";
      format?: string | [number, number];
      orientation?: "portrait" | "landscape";
    };
    pagebreak?: {
      mode?: Array<"avoid-all" | "css" | "legacy">;
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }

  {/*html2pdf.js의 타입 정의 */ }
  export interface Html2Pdf {
    from(element: HTMLElement): this;
    set(options: Html2PdfOptions): this;
    toPdf(): this;
    output(type: "blob"): Promise<Blob>;
    output(type: "datauristring"): Promise<string>;
    output(type: "arraybuffer"): Promise<ArrayBuffer>;
    get(type: "blob"): Promise<Blob>;
    get(type: "datauristring"): Promise<string>;
    get(type: "arraybuffer"): Promise<ArrayBuffer>;
    save(filename?: string): void;
  }

  const html2pdf: () => Html2Pdf;
  export default html2pdf;
}

declare module "quill-mention" {
  const Mention: any;
  export default Mention;
}
