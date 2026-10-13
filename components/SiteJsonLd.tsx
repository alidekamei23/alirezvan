// SiteJsonLd — the practice described for search engines (schema.org Attorney, which is
// a LegalService and a LocalBusiness), on every page. All values come from
// content/lawyer.ts; fields that are not known yet are left out, never guessed.
// Mounted once in the layout.
import { JsonLd } from "@/components/JsonLd";
import { lawyer } from "@/content/lawyer";
import { practiceAreas } from "@/content/practice-areas";

export function SiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Attorney",
        "@id": "/#attorney",
        name: `${lawyer.name}، ${lawyer.grade}`,
        url: "/",
        image: lawyer.photo.src,
        telephone: lawyer.phone.tel,
        address: {
          "@type": "PostalAddress",
          streetAddress: lawyer.address,
          addressLocality: lawyer.city,
          addressCountry: "IR",
        },
        areaServed: lawyer.city,
        knowsAbout: practiceAreas.map((area) => area.title),
        ...(lawyer.googleMapsUrl && { hasMap: lawyer.googleMapsUrl }),
        employee: {
          "@type": "Person",
          name: lawyer.name,
          jobTitle: lawyer.grade,
          memberOf: { "@type": "Organization", name: lawyer.licensingBody },
          identifier: lawyer.licenseNumber,
        },
      }}
    />
  );
}
