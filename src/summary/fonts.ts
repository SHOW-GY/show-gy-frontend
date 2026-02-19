export const FONT_LIST = [
  { key: "sans-serif", label: "Sans Serif", cssFamily: "sans-serif" },
  { key: "serif", label: "Serif", cssFamily: "serif" },
  { key: "monospace", label: "Monospace", cssFamily: "monospace" },

  { key: "YeogiOttaeJalnan", label: "잘난체", cssFamily: "'YeogiOttaeJalnan'" },
  { key: "OngleipParkDahyeon", label: "박다현체", cssFamily: "'OngleipParkDahyeon'" },
  { key: "KerisKeduLine", label: "케리스케두", cssFamily: "'KerisKeduLine'" },
  { key: "Yeongwol", label: "영월", cssFamily: "'Yeongwol'" },
  { key: "Hamchorom", label: "함초롬바탕", cssFamily: "'Hamchorom'" },
  { key: "Simple", label: "단조", cssFamily: "'Simple'" },
  { key: "DaeguDongseongRo", label: "대구동성로", cssFamily: "'DaeguDongseongRo'" },
  { key: "GiantsInline", label: "롯데자이언츠", cssFamily: "'GiantsInline'" },
  { key: "Mujeokhaebeong", label: "무적해병", cssFamily: "'Mujeokhaebeong'" },
  { key: "Cafe24Decobox", label: "카페24데코", cssFamily: "'Cafe24Decobox'" },

  { key: "NanumGothic", label: "나눔고딕", cssFamily: "'Nanum Gothic', sans-serif" },
  { key: "NanumMyeongjo", label: "나눔명조", cssFamily: "'Nanum Myeongjo', serif" },
  { key: "JejuGothic", label: "제주고딕", cssFamily: "'Jeju Gothic', sans-serif" },
  { key: "BlackHanSans", label: "검은고딕", cssFamily: "'Black Han Sans', sans-serif" },
] as const;

export type FontKey = (typeof FONT_LIST)[number]["key"];

export function getFontLabel(key: string) {
  return FONT_LIST.find((f) => f.key === key)?.label ?? "Font";
}
