export const SLASH_ITEMS = [
  { id: "math", value: "수식", desc: "/math" },
  { id: "table", value: "표", desc: "/table" },
  { id: "code", value: "코드", desc: "/code" },
  { id: "text", value: "텍스트", desc: "/text" },
  { id: "image", value: "이미지", desc: "/image" },
] as const;

export type SlashItem = (typeof SLASH_ITEMS)[number];
export type SlashItemId = SlashItem["id"];