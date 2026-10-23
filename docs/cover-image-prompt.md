# Cover image prompt (Gemini)

How to make the cover image («تصویر شاخص») of each blog post with Gemini, then put it on the site.

## 1. The prompt

Copy the prompt, replace `[عنوان مقاله]` with the post's title, and replace `[SUBJECT]` with the
line for the post's practice area from section 2. Keep the prompt in English: image models
follow English better, and the Persian title is only there to give context.

```text
Create an editorial cover photo for a Persian legal-information blog post titled:
"[عنوان مقاله]"

Subject: [SUBJECT]

Style: premium corporate editorial photograph, as in a top international law firm's website.
A modern, elegant law office: clean lines, glass, light stone or walnut, high-end minimal decor.
Soft natural daylight, shallow depth of field, sharp focus on the subject. Formal, professional,
no home or casual setting and no culture-specific objects.
Colour palette: warm off-white and cream (#FAF8F5, #F3F0EA), deep emerald green accents
(#047857, #064E3B), muted charcoal (#1F2933). Low contrast, no neon, no heavy saturation.
Composition: wide 16:9 landscape, main subject slightly off-centre with empty space around it,
nothing important near the edges (the site crops the image to 16:10).

Strict rules:
- No text, letters, numbers, logos, watermarks or signatures anywhere in the image.
- No readable documents, real names, ID numbers, cheque numbers or bank logos.
- No identifiable faces; hands or people seen from behind are fine.
- No judge's gavel, scales of justice, courtroom drama, handcuffs, money piles or flags.
- Nothing sensational, dramatic or advertising-like. Quiet and trustworthy.
```

## 2. Subject line for each practice area

| Area | `[SUBJECT]` |
| --- | --- |
| چک و سفته | A closed black leather cheque book and a premium fountain pen on a polished walnut desk in a modern office. |
| ملکی و اجاره | A set of keys resting on a closed leather folder on a glass desk, a blurred modern city skyline through floor-to-ceiling windows. |
| مطالبه و طلب | A closed leather document folder and an elegant pen on a dark wooden desk, a blurred modern law office in the background. |
| قرارداد | A hand in a tailored suit sleeve signing a blank contract with a fountain pen on a polished conference table. |

Adjust the subject to the article when it helps (for example, an empty modern apartment for
an eviction article), but keep the rules above.

## 3. Check before uploading

- No letters or numbers anywhere (zoom in: models often add fake text on papers and screens).
- Nothing on the "never" list in CLAUDE.md §2.1: no outcome promise, no sensational image.
- Landscape, at least 1600 px wide. File: JPG, PNG or WebP, at most 5 MB.

If Gemini adds text, ask: "Same image, remove all text and numbers."

## 4. Put it on the site

1. Sign in at `/admin`, open «مقاله‌ها» and the article (or create it).
2. In the «تصویر شاخص» panel, choose the image file. The site resizes it, converts it to WebP
   and removes all metadata by itself.
3. Fill «متن جایگزین تصویر شاخص» in Persian: a short description of what is in the picture,
   for example «دسته‌چک و خودکار روی میز کار». Do not repeat the title.
4. Save, check the preview, then publish.
