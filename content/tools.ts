export type ToolSlug = "khesarat-takhir" | "ejare";

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
  ejare: {
    slug: "ejare",
    href: "/tools/ejare",
    title: "محاسبه افزایش اجاره",
    // TODO: lawyer review
    summary: "برآورد سقف افزایش اجاره‌بها در تهران",
  },
};

export const toolList: Tool[] = Object.values(tools);
