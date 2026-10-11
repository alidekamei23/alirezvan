// Internal showcase of every token and component. Development only: a production build
// answers 404 here. When /admin gets basic auth (session 6) this can move under it.
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Send } from "lucide-react";
import { Alert } from "@/components/Alert";
import { AuthorBox } from "@/components/AuthorBox";
import { Badge } from "@/components/Badge";
import { BaleButton } from "@/components/BaleButton";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/Button";
import { CallButton } from "@/components/CallButton";
import { Card } from "@/components/Card";
import { Container } from "@/components/Container";
import { DatePicker } from "@/components/DatePicker";
import { Divider } from "@/components/Divider";
import { EmptyState } from "@/components/EmptyState";
import { EstimateNotice } from "@/components/EstimateNotice";
import { Faq } from "@/components/Faq";
import { Grid } from "@/components/Grid";
import { GuideCard } from "@/components/GuideCard";
import { LawyerCard } from "@/components/LawyerCard";
import { LicenseStrip } from "@/components/LicenseStrip";
import { LinkButton } from "@/components/LinkButton";
import { MoneyField } from "@/components/MoneyField";
import { OtpInput } from "@/components/OtpInput";
import { PhoneField } from "@/components/PhoneField";
import { PracticeCard } from "@/components/PracticeCard";
import { PracticeIndex } from "@/components/PracticeIndex";
import { Prose } from "@/components/Prose";
import { RadioCards } from "@/components/RadioCards";
import { ResultCard } from "@/components/ResultCard";
import { ReviewedAt } from "@/components/ReviewedAt";
import { Select } from "@/components/Select";
import { ShareActions } from "@/components/ShareActions";
import { Skeleton } from "@/components/Skeleton";
import { Stack } from "@/components/Stack";
import { Table } from "@/components/Table";
import { TextField } from "@/components/TextField";
import { Textarea } from "@/components/Textarea";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ESTIMATE_DISCLAIMER } from "@/content/legal";
import { practiceAreas } from "@/content/practice-areas";
import { formatToman, toPersianDigits } from "@/lib/format";
import { ToastDemo } from "./ToastDemo";

export const metadata = { title: "سیستم طراحی (داخلی)" };

const emerald = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const semantic = [
  "page",
  "surface",
  "surface-muted",
  "ink",
  "muted",
  "line",
  "line-strong",
  "primary",
  "primary-hover",
  "primary-active",
  "primary-soft",
  "primary-soft-strong",
  "primary-line",
  "success-surface",
  "success-ink",
  "warning-surface",
  "warning-ink",
  "danger",
  "danger-surface",
  "danger-ink",
  "info-surface",
  "info-ink",
  "estimate-surface",
  "estimate-ink",
  "disabled-surface",
  "disabled-ink",
];

const typeSteps = [
  ["text-3xl", "عنوان صفحه (h1)"],
  ["text-2xl", "عنوان بخش (h2)"],
  ["text-xl", "عنوان فرعی (h3)"],
  ["text-lg", "متن برجسته"],
  ["text-base", "متن اصلی"],
  ["text-sm", "متن کوچک و توضیح"],
] as const;

function Swatch({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="size-11 shrink-0 rounded-sm border border-line"
        style={{ background: `var(--color-${name})` }}
      />
      <code dir="ltr" className="text-sm text-muted">
        {name}
      </code>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-10">
      <h2 className="mb-6 text-2xl font-bold text-ink">{title}</h2>
      <Stack>{children}</Stack>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted">{title}</h3>
      {children}
    </div>
  );
}

const row = "flex flex-wrap items-center gap-3";

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const sampleResult = [
    "اصل طلب: ۱۰۰٬۰۰۰٬۰۰۰ تومان",
    "جمع: ۱۴۲٬۳۰۰٬۰۰۰ تومان",
    ESTIMATE_DISCLAIMER,
  ].join("\n");

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-extrabold text-ink">سیستم طراحی</h1>
      <p className="mt-2 mb-10 max-w-reading text-muted">
        صفحه داخلی؛ فقط در محیط توسعه در دسترس است. داده‌های این صفحه نمونه‌اند.
      </p>

      <Block title="رنگ">
        <Sub title="Emerald">
          <Grid cols={4}>
            {emerald.map((step) => (
              <Swatch key={step} name={`emerald-${step}`} />
            ))}
          </Grid>
        </Sub>
        <Sub title="Semantic">
          <Grid cols={4}>
            {semantic.map((name) => (
              <Swatch key={name} name={name} />
            ))}
          </Grid>
        </Sub>
      </Block>

      <Block title="تایپوگرافی">
        {typeSteps.map(([step, label]) => (
          <div key={step} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
            <code dir="ltr" className="w-24 shrink-0 text-sm text-muted">
              {step}
            </code>
            <p className={`${step} font-bold`}>{label}</p>
          </div>
        ))}
        <p className="max-w-reading">
          متن اصلی با ارتفاع سطر ۱٫۹ برای خوانایی فارسی تنظیم شده است. نیم‌فاصله در
          واژه‌هایی مانند «می‌شود» و «پرونده‌ها» رعایت می‌شود و همه اعداد با رقم فارسی
          نمایش داده می‌شوند: {toPersianDigits(1405)}.
        </p>
      </Block>

      <Block title="شعاع، سایه و فاصله">
        <div className={row}>
          <div className="flex size-24 items-center justify-center rounded-sm border border-line bg-surface text-sm">
            sm
          </div>
          <div className="flex size-24 items-center justify-center rounded-md border border-line bg-surface text-sm">
            md
          </div>
          <div className="flex size-24 items-center justify-center rounded-lg border border-line bg-surface text-sm">
            lg
          </div>
          <div className="flex size-24 items-center justify-center rounded-md bg-surface text-sm shadow-sm">
            shadow-sm
          </div>
          <div className="flex size-24 items-center justify-center rounded-md bg-surface text-sm shadow-md">
            shadow-md
          </div>
        </div>
        <div className="flex items-end gap-2">
          {[1, 2, 3, 4, 6, 8, 12, 16].map((step) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <div className="w-6 bg-primary" style={{ height: `calc(var(--spacing) * ${step})` }} />
              <span className="text-sm text-muted">{toPersianDigits(step * 4)}</span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="دکمه‌ها">
        <Sub title="Variants">
          <div className={row}>
            <Button>اصلی</Button>
            <Button variant="secondary">ثانویه</Button>
            <Button variant="ghost">کم‌رنگ</Button>
            <Button variant="danger">خطر</Button>
          </div>
        </Sub>
        <Sub title="Sizes">
          <div className={row}>
            <Button size="sm">کوچک</Button>
            <Button size="md">متوسط</Button>
            <Button size="lg">بزرگ</Button>
          </div>
        </Sub>
        <Sub title="Icon, loading, disabled">
          <div className={row}>
            <Button icon={<Send />}>ارسال کد</Button>
            <Button loading>در حال ارسال</Button>
            <Button disabled>غیرفعال</Button>
            <Button variant="secondary" disabled>
              غیرفعال
            </Button>
          </div>
        </Sub>
        <Sub title="LinkButton and contact buttons">
          <div className={row}>
            <LinkButton href="/request">درخواست مشاوره</LinkButton>
            <CallButton />
            <WhatsAppButton />
            <BaleButton />
            <WhatsAppButton variant="ghost" size="sm" />
          </div>
        </Sub>
      </Block>

      <Block title="فرم">
        <div className="grid max-w-form gap-6">
          <TextField label="نام و نام خانوادگی" name="name" autoComplete="name" />
          <TextField label="نام شرکت" name="company" optional hint="در صورت وجود" />
          <TextField
            label="حالت خطا"
            name="error-demo"
            defaultValue="متن نمونه"
            error="این بخش را کامل کنید."
          />
          <TextField label="غیرفعال" name="disabled-demo" defaultValue="متن نمونه" disabled />
          <PhoneField label="شماره موبایل" name="mobile" />
          <PhoneField
            label="شماره موبایل (خطا)"
            name="mobile-error"
            defaultValue="0912345"
            error="شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود."
          />
          <MoneyField label="مبلغ اصل طلب" name="principal" defaultValue={12500000} />
          <Select
            label="حوزه"
            name="area"
            options={practiceAreas.map((area) => ({ value: area.slug, label: area.title }))}
          />
          <Textarea label="خلاصه موضوع" name="summary" hint="حداکثر ۳۰۰ نویسه" />
          <RadioCards
            legend="نوع مشاوره"
            name="type"
            columns={1}
            defaultValue="phone"
            options={[
              { value: "phone", title: "تلفنی", description: "۱۵ دقیقه" },
              { value: "office", title: "حضوری در دفتر", description: "۴۵ دقیقه" },
              { value: "video", title: "تصویری", description: "۴۵ دقیقه" },
            ]}
          />
          <DatePicker
            legend="تاریخ سررسید"
            name="start"
            minYear={1380}
            maxYear={1405}
            defaultValue="1404-07-19"
          />
          <DatePicker
            legend="تاریخ (خطا)"
            name="end"
            minYear={1380}
            maxYear={1405}
            error="تاریخ پایان نباید پیش از تاریخ شروع باشد."
          />
          <OtpInput
            label="کد تأیید"
            name="code"
            hint="کد ۵ رقمی پیامک‌شده را وارد کنید."
          />
          <OtpInput label="کد تأیید (خطا)" name="code-error" error="کد وارد‌شده درست نیست." />
        </div>
      </Block>

      <Block title="بازخورد">
        <div className="grid max-w-reading gap-4">
          <Alert tone="info" title="اطلاع">
            درخواست شما پس از تأیید شماره موبایل ثبت می‌شود.
          </Alert>
          <Alert tone="success" title="درخواست ثبت شد">
            دفتر برای هماهنگی با شما تماس می‌گیرد.
          </Alert>
          <Alert tone="warning" title="شاخص این ماه هنوز منتشر نشده است">
            محاسبه با آخرین ماه منتشرشده انجام شد.
          </Alert>
          <Alert tone="danger" title="ارسال پیامک انجام نشد">
            چند دقیقه دیگر دوباره تلاش کنید یا با دفتر تماس بگیرید.
          </Alert>
          <EstimateNotice />
        </div>
        <Sub title="Toast">
          <ToastDemo />
        </Sub>
        <Sub title="Skeleton">
          <div className="grid max-w-form gap-3" aria-busy="true">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>
        </Sub>
        <Sub title="EmptyState">
          <EmptyState
            title="هنوز درخواستی ثبت نشده است"
            description="درخواست‌های مشاوره پس از ثبت در این فهرست دیده می‌شوند."
          />
        </Sub>
      </Block>

      <Block title="محتوا">
        <Breadcrumbs
          items={[
            { label: "خانه", href: "/" },
            { label: "راهنماها", href: "/guides" },
            { label: "عنوان راهنما" },
          ]}
        />
        <div className={row}>
          <Badge>خنثی</Badge>
          <Badge tone="primary">چک و سفته</Badge>
          <Badge tone="success">ثبت شد</Badge>
          <Badge tone="warning">در انتظار</Badge>
          <Badge tone="danger">بسته شد</Badge>
          <Badge tone="info">جدید</Badge>
        </div>
        <PracticeIndex areas={practiceAreas} />
        <Grid cols={4}>
          {practiceAreas.map((area) => (
            <PracticeCard key={area.slug} area={area} />
          ))}
        </Grid>
        <Grid cols={3}>
          <GuideCard
            href="/guides"
            area="چک و سفته"
            title="عنوان نمونه یک راهنما"
            summary="خلاصه نمونه برای نمایش چیدمان کارت راهنما در دو تا سه سطر."
            reviewedAt="1405-07-12"
          />
          <Card>
            <p className="font-bold">کارت ساده</p>
            <p className="text-sm text-muted">برای گروه‌بندی محتوای مرتبط.</p>
          </Card>
          <Card padding="lg">
            <p className="font-bold">کارت با فاصله بیشتر</p>
            <p className="text-sm text-muted">padding=&quot;lg&quot;</p>
          </Card>
        </Grid>
        <Divider />
        <Faq
          items={[
            { q: "پرسش نمونه نخست", a: "پاسخ نمونه برای نمایش چیدمان آکاردئون." },
            { q: "پرسش نمونه دوم با متنی بلندتر برای آزمودن شکستن سطر", a: "پاسخ نمونه." },
          ]}
        />
        <Table
          caption="جدول نمونه"
          head={["ماه", "شاخص", "توضیح"]}
          rows={[
            ["مهر ۱۴۰۴", "—", "داده نمونه"],
            ["آبان ۱۴۰۴", "—", "داده نمونه"],
          ]}
        />
        <Table caption="جدول خالی" head={["ماه", "شاخص"]} rows={[]} />
        <Prose>
          <h2>عنوان بخش در راهنما</h2>
          <p>
            پاراگراف نمونه با <a href="#">پیوند</a> و <strong>تأکید</strong> و کد{" "}
            <code>Art. 522</code>.
          </p>
          <ol>
            <li>مرحله نخست</li>
            <li>مرحله دوم</li>
          </ol>
          <ul>
            <li>مورد نخست</li>
            <li>مورد دوم</li>
          </ul>
          <blockquote>نقل‌قول نمونه از متن یک ماده قانونی.</blockquote>
        </Prose>
      </Block>

      <Block title="اعتماد">
        <LicenseStrip />
        <Grid cols={2}>
          <LawyerCard />
          <Stack gap="sm">
            <AuthorBox reviewedAt="1405-07-12" />
            <ReviewedAt date="1405-07-12" />
          </Stack>
        </Grid>
      </Block>

      <Block title="ماشین‌حساب">
        <div className="max-w-reading">
          <ResultCard
            title="نتیجه محاسبه (نمونه)"
            rows={[
              { label: "اصل طلب", value: formatToman(100_000_000) },
              { label: "خسارت تأخیر", value: formatToman(42_300_000) },
            ]}
            total={{ label: "جمع", value: formatToman(142_300_000) }}
            notes={["اعداد این کارت نمونه‌اند و حاصل محاسبه واقعی نیستند."]}
          >
            <ShareActions text={sampleResult} requestHref="/request" />
          </ResultCard>
        </div>
      </Block>
    </Container>
  );
}
