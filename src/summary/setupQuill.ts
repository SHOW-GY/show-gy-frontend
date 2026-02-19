import Quill from "quill";
import ImageResize from "@mgreminger/quill-image-resize-module";
import { Mention } from "quill-mention";
import { SgMathBlockBlot } from "./mathBlot";

const Q: any = (Quill as any).default ?? Quill;
(window as any).Quill = Q;

const Size: any = Q.import("formats/size");
Size.whitelist = ["small", false, "large", "huge"];
Q.register(Size, true);

const Font: any = Q.import("formats/font");
Font.whitelist = [
  "sans-serif",
  "serif",
  "monospace",
  "YeogiOttaeJalnan",
  "OngleipParkDahyeon",
  "KerisKeduLine",
  "Yeongwol",
  "Hamchorom",
  "Simple",
  "DaeguDongseongRo",
  "GiantsInline",
  "Mujeokhaebeong",
  "Cafe24Decobox",
  "NanumGothic",
  "NanumMyeongjo",
  "JejuGothic",
  "BlackHanSans",
];

Q.register(Font, true);
Q.register("modules/imageResize", ImageResize);
Q.register("modules/mention", Mention);
Q.register(SgMathBlockBlot, true);

export { Q };
