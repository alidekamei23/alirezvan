export type ToolSlug =
  | "khesarat-takhir"
  | "hazine-dadresi"
  | "mahrieh"
  | "dastmozd-karshenasi"
  | "sahm-ol-ers"
  | "haghol-vekale"
  | "mohlat";

/** Sections of the /tools page, in display order. */
export const toolGroups = [
  { id: "procedure", title: "دادرسی و مهلت‌ها" },
  { id: "debt", title: "طلب و دعاوی مالی" },
  { id: "family", title: "خانواده و ارث" },
  { id: "fees", title: "هزینه وکیل و کارشناس" },
] as const;
export type ToolGroup = (typeof toolGroups)[number]["id"];

export type Tool = {
  slug: ToolSlug;
  href: string;
  title: string;
  summary: string;
  group: ToolGroup;
};

export const tools: Record<ToolSlug, Tool> = {
  "khesarat-takhir": {
    slug: "khesarat-takhir",
    href: "/tools/khesarat-takhir",
    group: "debt",
    title: "محاسبه خسارت تأخیر تأدیه",
    // TODO: lawyer review
    summary: "برآورد خسارت تأخیر بر پایه شاخص قیمت بانک مرکزی",
  },
  "hazine-dadresi": {
    slug: "hazine-dadresi",
    href: "/tools/hazine-dadresi",
    group: "debt",
    title: "محاسبه هزینه دادرسی",
    // TODO: lawyer review
    summary: "برآورد هزینه دادرسی دعاوی مالی در مراحل بدوی، تجدیدنظر و فرجام",
  },
  mahrieh: {
    slug: "mahrieh",
    href: "/tools/mahrieh",
    group: "family",
    title: "محاسبه مهریه به نرخ روز",
    // TODO: lawyer review
    summary: "برآورد مهریه وجه نقد به نرخ روز بر پایه شاخص سالانه بانک مرکزی",
  },
  "dastmozd-karshenasi": {
    slug: "dastmozd-karshenasi",
    href: "/tools/dastmozd-karshenasi",
    group: "fees",
    title: "محاسبه دستمزد کارشناسی",
    // TODO: lawyer review
    summary: "برآورد دستمزد کارشناس رسمی دادگستری بر پایه تعرفه ۱۴۰۵",
  },
  "sahm-ol-ers": {
    slug: "sahm-ol-ers",
    href: "/tools/sahm-ol-ers",
    group: "family",
    title: "محاسبه سهم‌الارث",
    // TODO: lawyer review
    summary: "برآورد سهم هر وارث به کسر، درصد و مبلغ بر پایه قانون مدنی",
  },
  "haghol-vekale": {
    slug: "haghol-vekale",
    href: "/tools/haghol-vekale",
    group: "fees",
    title: "محاسبه حق‌الوکاله و تمبر وکیل",
    // TODO: lawyer review
    summary: "برآورد حق‌الوکاله طبق تعرفه، تمبر مالیاتی و سهم کانون یا مرکز",
  },
  mohlat: {
    slug: "mohlat",
    href: "/tools/mohlat",
    group: "procedure",
    title: "محاسبه مهلت‌های قانونی",
    // TODO: lawyer review
    summary: "آخرین روز مهلت تجدیدنظر، واخواهی، فرجام و اعتراض با لحاظ تعطیلات رسمی",
  },
};

export const toolList: Tool[] = Object.values(tools);

/** The six shown on Home (three by two); every tool is on the /tools page. */
export const homeTools: Tool[] = (
  ["mohlat", "khesarat-takhir", "hazine-dadresi", "mahrieh", "sahm-ol-ers", "haghol-vekale"] as const
).map((slug) => tools[slug]);

/** The page that lists every tool. */
export const TOOLS_INDEX_HREF = "/tools";
