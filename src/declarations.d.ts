// src/types/declarations.d.ts

declare module "html2pdf.js" {
  export interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };

    // html2canvas options (필요한 것만 확장)
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      backgroundColor?: string | null;
      logging?: boolean;
      dpi?: number;
      letterRendering?: boolean;
      allowTaint?: boolean;
    };

    // jsPDF options (필요한 것만 확장)
    jsPDF?: {
      unit?: "pt" | "mm" | "cm" | "in" | "px";
      format?: string | [number, number];
      orientation?: "portrait" | "landscape";
    };

    // 페이지 잘림 완화 옵션
    pagebreak?: {
      mode?: Array<"avoid-all" | "css" | "legacy">;
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }

  export interface Html2Pdf {
    from(element: HTMLElement): this;
    set(options: Html2PdfOptions): this;

    // html2pdf 체인
    toPdf(): this;

    // 결과 얻기
    output(type: "blob"): Promise<Blob>;
    output(type: "datauristring"): Promise<string>;
    output(type: "arraybuffer"): Promise<ArrayBuffer>;

    get(type: "blob"): Promise<Blob>;
    get(type: "datauristring"): Promise<string>;
    get(type: "arraybuffer"): Promise<ArrayBuffer>;

    // 저장
    save(filename?: string): void;
  }

  const html2pdf: () => Html2Pdf;
  export default html2pdf;
}
