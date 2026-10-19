export type ToolSlug =
  | "khesarat-takhir"
  | "hazine-dadresi"
  | "mahrieh"
  | "dastmozd-karshenasi"
  | "sahm-ol-ers"
  | "haghol-vekale";

export type Tool = {
  slug: ToolSlug;
  href: string;
  title: string;
  summary: string;
};

export const tools: Record<ToolSlug, Tool> = {
  "khesarat-takhir": {
    slug: "khesarat-takhir",
    href: "/tools/khesarat-takhir",
    title: "محاسبه خسارت تأخیر تأدیه",
    // TODO: lawyer review
    summary: "برآورد خسارت تأخیر بر پایه شاخص قیمت بانک مرکزی",
  },
  "hazine-dadresi": {
    slug: "hazine-dadresi",
    href: "/tools/hazine-dadresi",
    title: "محاسبه هزینه دادرسی",
    // TODO: lawyer review
    summary: "برآورد هزینه دادرسی دعاوی مالی در مراحل بدوی، تجدیدنظر و فرجام",
  },
  mahrieh: {
    slug: "mahrieh",
    href: "/tools/mahrieh",
    title: "محاسبه مهریه به نرخ روز",
    // TODO: lawyer review
    summary: "برآورد مهریه وجه نقد به نرخ روز بر پایه شاخص سالانه بانک مرکزی",
  },
  "dastmozd-karshenasi": {
    slug: "dastmozd-karshenasi",
    href: "/tools/dastmozd-karshenasi",
    title: "محاسبه دستمزد کارشناسی",
    // TODO: lawyer review
    summary: "برآورد دستمزد کارشناس رسمی دادگستری بر پایه تعرفه ۱۴۰۵",
  },
  "sahm-ol-ers": {
    slug: "sahm-ol-ers",
    href: "/tools/sahm-ol-ers",
    title: "محاسبه سهم‌الارث",
    // TODO: lawyer review
    summary: "برآورد سهم هر وارث به کسر، درصد و مبلغ بر پایه قانون مدنی",
  },
  "haghol-vekale": {
    slug: "haghol-vekale",
    href: "/tools/haghol-vekale",
    title: "محاسبه حق‌الوکاله و تمبر وکیل",
    // TODO: lawyer review
    summary: "برآورد حق‌الوکاله طبق تعرفه، تمبر مالیاتی و سهم کانون یا مرکز",
  },
};

export const toolList: Tool[] = Object.values(tools);
