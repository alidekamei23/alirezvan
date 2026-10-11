/*
 * Copy for fixed pages (Home, About, Contact). Kept here, not in the page files, so it
 * can be exported for the lawyer's review with `npm run review:hubs`.
 * TODO: lawyer review — everything in this file is a draft.
 */

export const homeCopy = {
  lead: "مشاوره و وکالت در تهران؛ دعاوی چک و سفته، ملکی و اجاره، مطالبه طلب و قرارداد.",
};

export const consultationTypes = [
  { value: "phone", title: "تلفنی", description: "۱۵ دقیقه" },
  { value: "office", title: "حضوری در دفتر", description: "۴۵ دقیقه" },
  { value: "video", title: "تصویری", description: "۴۵ دقیقه" },
] as const;

export const aboutCopy = {
  heading: "درباره علی رضوان",
  metaDescription:
    "معرفی علی رضوان، وکیل پایه یک دادگستری در تهران: مشخصات پروانه وکالت، حوزه‌های کاری و شیوه دریافت مشاوره.",
  intro:
    "علی رضوان وکیل پایه یک دادگستری است و در تهران در چهار حوزه چک و سفته، ملکی و اجاره، مطالبه طلب و قرارداد مشاوره می‌دهد و وکالت می‌پذیرد.",
  processHeading: "شیوه کار",
  process: [
    {
      title: "ثبت درخواست مشاوره",
      text: "موضوع را در چند سطر می‌نویسید و نوع مشاوره و زمان مناسب خود را انتخاب می‌کنید.",
    },
    {
      title: "هماهنگی زمان",
      text: "دفتر برای تعیین زمان مشاوره با شما تماس می‌گیرد.",
    },
    {
      title: "جلسه مشاوره",
      text: "مدارک و شرایط پرونده بررسی می‌شود و مسیرهای پیش رو، همراه با زمان و هزینه تقریبی هر کدام، توضیح داده می‌شود.",
    },
    {
      title: "تصمیم با شما",
      text: "پس از مشاوره، درباره ادامه کار و اعطای وکالت خودتان تصمیم می‌گیرید.",
    },
  ],
};

export const contactCopy = {
  heading: "تماس با دفتر",
  metaDescription:
    "نشانی، ساعات کاری و راه‌های تماس با دفتر علی رضوان، وکیل پایه یک دادگستری در تهران: تلفن، واتس‌اپ، بله و درخواست مشاوره.",
  intro:
    "برای هماهنگی مشاوره می‌توانید با دفتر تماس بگیرید، در واتس‌اپ یا بله پیام بدهید یا درخواست مشاوره ثبت کنید.",
};

export const DRAFT_NOTICE = {
  title: "این متن پیش‌نویس است",
  text: "محتوای این صفحه هنوز بازبینی حقوقی نشده و پیش از انتشار سایت اصلاح می‌شود.",
};
