/**
 * Single source of truth for the lawyer's identity and contact details.
 *
 * `null` means "not known yet": components must render nothing for a null field.
 * Do not guess missing values.
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

  // TODO(lawyer): map coordinates. Working hours are not shown, by the owner's decision.
  city: "تهران",
  address: "خیابان دکتر شریعتی، روبه‌روی حسینیه ارشاد، ابتدای کوچه شهیم، پلاک ۶، واحد ۳",
  googleMapsUrl: null as string | null,

  /** The one contact number. Stored with Latin digits; format for display. */
  phone: { display: "0910-070-8005", tel: "+989100708005" },
  /** International format without "+", as wa.me expects. */
  whatsapp: "989100708005",
  // TODO(lawyer): Bale username, without "@". The Bale button is hidden while this is null.
  bale: null as string | null,
} as const;

export const contactLinks = {
  call: `tel:${lawyer.phone.tel}`,
  whatsapp: `https://wa.me/${lawyer.whatsapp}`,
  bale: lawyer.bale ? `https://ble.ir/${lawyer.bale}` : null,
} as const;
