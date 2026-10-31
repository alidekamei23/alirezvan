# Design system

The visual and interaction rules for the Ali Rezvan site. `CLAUDE.md` wins wherever the
two disagree. The live reference is `/design-system` (development only; it returns 404
in a production build).

Direction: a quiet law office. Text-led, generous whitespace, one deep emerald used
sparingly (about a tenth of any screen), flat surfaces, no gradients, no decorative
motion, no legal stock imagery. One exception to the emerald share: the Home hero on
phones is a dark emerald band (`HomeHero`, owner's decision, 25 Oct 2026).

## 1. Tokens

All tokens live in `app/globals.css` and reach components as Tailwind utilities.
Tailwind's own palette, radius, shadow, type and breakpoint scales are cleared, so a
class like `bg-blue-500` or `rounded-2xl` does not exist in this project.

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `page` | `#FAF8F5` | Page background |
| `surface` | `#FFFFFF` | Cards, header, footer, inputs |
| `surface-muted` | `#F3F0EA` | Alternate section band, table head |
| `ink` | `#1F2933` | Body text and headings |
| `muted` | `#5B6673` | Secondary text, hints |
| `line` | `#E4E0D8` | Dividers and card borders |
| `line-strong` | `#7B8491` | Borders of form controls (3:1) |
| `primary` / `-hover` / `-active` | emerald 700 / 800 / 900 | Buttons, links, key figures |
| `primary-soft` / `-soft-strong` / `primary-line` | emerald 50 / 100 / 200 | Hover fills, selected state, soft borders |
| `on-primary` | white | Text on primary and danger |
| `focus` | emerald 700 | Focus ring |
| `inverse-surface` | emerald 900 | The one dark surface: Home hero band on phones |
| `on-inverse` / `on-inverse-muted` | white / emerald 200 | Text on the inverse surface |
| `focus-inverse` | white | Focus ring on the inverse surface (`focus-inverse` utility) |
| `success-*`, `warning-*`, `danger-*`, `info-*` | see file | `-surface`, `-line`, `-ink` triples for notices |
| `danger` / `-hover` / `-active` | `#B42318` … | Danger button, error border |
| `estimate-*` | `#FFF7E0` surface | Calculator estimate notice |
| `disabled-surface` / `disabled-ink` | | Disabled controls |

Emerald runs 50–950. Anchors: 700 `#047857`, 800 `#065F46`, 900 `#064E3B`,
50 `#ECFDF5`, 100 `#D1FAE5`. Steps 200–600 are slightly desaturated so tints read as
sober rather than mint.

Use the semantic names in components. The raw emerald steps are for the token file and
the showcase only. Keeping names semantic is what will let dark mode be added later by
redefining tokens; dark mode is not built.

### Type

One family: Vazirmatn (variable, self-hosted in `app/fonts/`). Pages load the 48KB Persian
build; the full build is fetched only where Latin letters or digits are shown. Six fluid steps:

| Utility | Size | Line height | Use |
| --- | --- | --- | --- |
| `text-3xl` | 31–44px | 1.4 | Page title (h1), one per page |
| `text-2xl` | 26–32px | 1.5 | Section title (h2) |
| `text-xl` | 22–25px | 1.6 | Sub-heading (h3), key figures |
| `text-lg` | 19–21px | 1.8 | Lead paragraph, card titles |
| `text-base` | 17–18px | 1.9 | Body |
| `text-sm` | 14px | 1.75 | Hints, captions, meta |

At most three heading sizes on a page. Weights: 400 body, 600 labels and buttons,
700 headings, 800 only for the h1.

### Space, shape, depth, motion

- Spacing: 4px base (`p-1` = 4px). Sections use `py-12 md:py-16`. Page gutters come from
  the `px-gutter` utility (16px, 24px from `sm`), which also clears the notch on phones held
  sideways; `Container` applies it, so don't add side padding to page bands by hand.
- Radius: `rounded-sm` 8px (controls, buttons), `rounded-md` 12px (cards),
  `rounded-lg` 16px (large media). `rounded-full` for badges and avatars.
- Elevation: `shadow-sm` (result card, hovered link card) and `shadow-md` (toast, sticky
  bar, the open `NavDisclosure` panel). Nothing else has a shadow.
- Breakpoints: `xs` 360, `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- Widths: `max-w-page` 72rem, `max-w-reading` 42rem, `max-w-form` 32rem.
- z-index: `z-sticky` (header) < `z-bar` (contact bar) < `z-overlay` < `z-toast`.
- Motion: colour and border transitions only, 150ms (`--duration-base` 200ms for the FAQ
  and `NavDisclosure` chevrons), ease-out. All motion is switched off under `prefers-reduced-motion`.
- Focus: 2px emerald outline with a 2px gap, set once globally. Never remove it.

## 2. Components

One component per file in `components/`. Each file starts with a usage note.

| Group | Components |
| --- | --- |
| Foundations | `Container`, `Section`, `Stack`, `Grid`, `Prose`, `Ltr`, `Divider` |
| Actions | `Button`, `LinkButton` (variants: primary, secondary, ghost, danger, and inverse for the dark band only), `CallButton`, `WhatsAppButton`, `BaleButton` (base: `ContactButton`; classes: `buttonStyles`) |
| Forms | `TextField`, `PhoneField`, `MoneyField`, `Select`, `Combobox`, `Textarea`, `RadioCards`, `SegmentedControl`, `Checkbox`, `Stepper`, `DatePicker`, `OtpInput` (shell: `Field`) |
| Feedback | `Alert`, `EstimateNotice`, `DraftNotice`, `Toast` (`ToastProvider`, `useToast`), `Skeleton`, `EmptyState` |
| Content | `Card`, `PracticeIndex`, `PracticeTiles` (phones), `PracticeCard`, `ScrollCue`, `ToolIndex`, `ToolCard`, `Steps`, `PostCard`, `TopicFilter`, `Pagination`, `ContactBox`, `Faq`, `Disclosure` (`DisclosureGroup`), `Breadcrumbs`, `Badge`, `Table` |
| Trust | `LicenseStrip`, `LawyerCard`, `AuthorBox`, `UpdatedAt` |
| Article text | `ArticleBody` (an article's Markdown from the database, rendered inside `Prose`; also the editor preview) |
| Q&A (`components/questions/`) | `QuestionArticle` (one question and its answer; also the admin preview), `QuestionIndex` (ruled list), `AskForm`, `TrackPanel`, `ViewCounter` |
| Admin (`components/admin/`) | `LoginForm`, `ArticleEditor`, `QuestionEditor`, `MarkdownEditor` (toolbar, text and live preview; shared by both editors), `PendingQuestions`. The admin panel uses the same tokens and form components as the site, with its own plain header instead of `SiteShell` |
| Layout | `SiteShell` (frame of every public page), `HomeHero`, `Header`, `HeaderRequestLink`, `NavDisclosure` (the practice areas in the desktop navigation), `MobileMenu`, `Footer`, `PageHeader`, `ContactCta`, `PracticeHub`, `BlogIndex` and `TextPage` (page templates), `StickyContactBar`, `SkipLink` |
| Calculator | `ResultCard`, `ShareActions`, `CopyButton`, `ShareBar`, `RelatedTools`; one client component per tool: `TadiehCalculator` (late-payment damages), `HazineCalculator` (court fees), `MahriehCalculator`, `KarshenasiCalculator` (expert fees), `ErsCalculator` (inheritance shares), `VekalatCalculator` (lawyer fee and stamp), `MohlatCalculator` (legal deadlines, with a month calendar) and `DiyehCalculator` (diyeh, with a list of added injuries) |

State coverage: buttons have hover, focus-visible, active, disabled and loading; form
controls have hover, focus-visible, disabled and error; link cards have hover, focus and
active. Data views have empty (`EmptyState`, `Table` empty row) and loading (`Skeleton`)
states; errors use `Alert tone="danger"`.

Form values: `PhoneField`, `MoneyField`, `DatePicker` and `OtpInput` show Persian digits
and submit Latin digits through a hidden input named by `name`. Dates are submitted as
Jalali `YYYY-MM-DD`.

Home leads with the license particulars (`LicenseStrip`) and lists the practice areas
as a ruled index (`PracticeIndex`), in the manner of a formal document. Reach for a
ruled list before a grid of identical cards when the items are the page's main content.

On phones (below `md`) Home is laid out for one glance: `HomeHero` turns into the dark
band (round photo beside the name, the lead, one light `inverse` button; call and
WhatsApp stay in the sticky bar), `LicenseStrip` puts its three items in one row with
the value above the label, the practice areas become `PracticeTiles` (2×2, icon and
title), and a `ScrollCue` points to the next section. These phone styles are `max-md:`
additions on top of the desktop classes, so from `md` Home is unchanged. Keep it that
way: add phone styles with `max-md:`, don't edit the base classes for them.

## 3. Do and don't

Do
- Use one primary (filled) button per screen. Everything else is secondary or ghost.
- Keep the three exits reachable on every page: call, WhatsApp/Bale (sticky bar on
  phones, contact buttons on desktop) and «درخواست مشاوره» (header,
  `HeaderRequestLink`). One exception: on Home below `md` the header link is hidden,
  because the hero's request button sits right under it; the mobile menu still lists it.
- Take names, numbers and license details from `content/lawyer.ts`. Never type them
  into a page.
- Render every calculator result with `ResultCard`; it always shows the estimate notice.
- Show `UpdatedAt` on every blog post and post card.
- Use `lucide-react` icons at the default stroke width, sized with `size-4/5/6`, and
  hide decorative ones with `aria-hidden`.

Don't
- Don't write a hex colour, pixel size or shadow in a component.
- Don't add gradients, glass effects, entrance animations, carousels or countdowns.
  The one exception is the faint dot grid behind the Home hero (`.hero-dots` in
  `app/globals.css`); don't reuse it elsewhere.
- Don't use scales, gavels, courtrooms or gold-and-black styling. No gold on the
  emerald band either.
- Don't use the inverse surface outside the Home hero.
- Don't use badges, banners or copy for superlatives, rankings, discounts, success
  rates, outcome promises or client details (`CLAUDE.md` §2.1).
- Don't load anything from another domain at runtime: no font, icon, script or map CDN.
- Don't add `noindex` outside `/admin`.

## 4. RTL checklist

- [ ] Only logical utilities: `ms-* me-* ps-* pe-* start-* end-* text-start text-end
      border-s border-e`. No `ml/mr/pl/pr/left/right/text-left/text-right`.
- [ ] "Forward" chevrons and arrows point left (`ChevronLeft`); "back" points right.
- [ ] Every visible number goes through `toPersianDigits`, `formatNumber` or
      `formatToman`. Values are stored and computed with Latin digits.
- [ ] Phone numbers, URLs, emails and Latin codes are wrapped in `<Ltr>`.
- [ ] OTP boxes and the phone input run left to right; everything else follows the page.
- [ ] Persian ی and ک, and ZWNJ where needed («می‌شود»). User input is normalised with
      `normalizeInput` / `normalizePersian`.
- [ ] Dates are Jalali (`formatJalali`), in the Asia/Tehran time zone (`todayJalali`).

## 5. Accessibility checklist (WCAG 2.1 AA)

- [ ] `npm run check:contrast` passes (text 4.5:1, control borders and focus ring 3:1).
- [ ] One `h1`; headings descend without skipping a level.
- [ ] Landmarks: `header`, `nav` (each with a Persian `aria-label`), `main#main`,
      `footer`. The skip link is the first tab stop.
- [ ] Every control has a visible label. Errors are text, not colour alone, and are
      linked with `aria-describedby`; the control has `aria-invalid`.
- [ ] Every tap target is at least 44×44px.
- [ ] The whole page works with the keyboard alone; focus is always visible; the mobile
      menu traps focus and Escape closes it.
- [ ] Images have width and height (no layout shift) and meaningful or empty `alt`.
- [ ] No horizontal page scroll at 360px. Wide tables scroll inside `Table`, or turn into
      cards below 35rem of width with `Table stacked`.
- [ ] Messages that appear after an action use `Alert live` or `Toast`.

## 6. Checks

```
npm run lint
npm run typecheck
npm test
npm run check:contrast
```
