/**
 * Single source of truth for the lawyer's identity and contact details.
 *
 * Values in [brackets] and the phone numbers below are PLACEHOLDERS until
 * Mr. Rezvan supplies the real ones. Do not guess them. `null` means "not known yet";
 * components must render nothing for a null field.
 */
export const lawyer = {
  name: "علی رضوان",
  grade: "وکیل پایه یک دادگستری",

  // TODO(lawyer): licensing body, license number and the official lookup page
  licensingBody: "[مرجع صدور پروانه]",
  licenseNumber: "[شماره پروانه]",
  licenseLookupUrl: null as string | null,

  // TODO(lawyer): short bio, education, photos
  bio: null as string | null,
  education: [] as string[],
  photo: null as string | null,

  // TODO(lawyer): office address, working hours, map coordinates
  city: "تهران",
  address: "[نشانی دفتر]",
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
