export type ToolSlug = "khesarat-takhir" | "hazine-dadresi";

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
};

export const toolList: Tool[] = Object.values(tools);
