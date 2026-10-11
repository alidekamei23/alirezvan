/**
 * Single source of truth for the lawyer's identity and contact details.
 *
 * Values still in [brackets] and the phone numbers below are PLACEHOLDERS until
 * Mr. Rezvan supplies the real ones. Do not guess them. `null` means "not known yet";
 * components must render nothing for a null field.
 */
export const lawyer = {
  name: "علی رضوان",
  grade: "وکیل پایه یک دادگستری",

  licensingBody: "کانون وکلای دادگستری مرکز",
  /** Emblem of the licensing body, on a white background. */
  licensingBodyLogo: { src: "/images/kanoon-markaz.webp", width: 320, height: 395 },
  licenseNumber: "40949",
  // TODO(lawyer): URL of the official license-lookup page
  licenseLookupUrl: null as string | null,

  // TODO(lawyer): short bio, education, more photos
  bio: null as string | null,
  education: [] as string[],
  /** Full portrait on a white background; use on white surfaces only. */
  photo: { src: "/images/ali-rezvan-portrait.jpg", width: 976, height: 1100 },
  /** Square head-and-shoulders crop for small sizes. */
  avatar: { src: "/images/ali-rezvan-avatar.jpg", width: 384, height: 384 },

  // TODO(lawyer): working hours, map coordinates
  city: "تهران",
  address: "خیابان دکتر شریعتی، روبه‌روی حسینیه ارشاد، ابتدای کوچه شهیم، پلاک ۶، واحد ۳",
  workingHours: "[ساعات کاری]",
  googleMapsUrl: null as string | null,

  // TODO(lawyer): real numbers. Stored with Latin digits; format for display.
  phone: { display: "021-00000000", tel: "+982100000000" },
  mobile: { display: "0912-000-0000", tel: "+989120000000" },
  /** International format without "+", as wa.me expects. */
  whatsapp: "989120000000",
  /** Bale username, without "@". */
  bale: "placeholder",
} as const;

export const contactLinks = {
  call: `tel:${lawyer.phone.tel}`,
  whatsapp: `https://wa.me/${lawyer.whatsapp}`,
  bale: `https://ble.ir/${lawyer.bale}`,
} as const;
