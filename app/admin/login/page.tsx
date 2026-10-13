import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { Container } from "@/components/Container";
import { lawyer } from "@/content/lawyer";
import { getAdminSession } from "@/lib/auth/admin";

export const metadata = { title: "ورود" };

export default async function AdminLoginPage() {
  // Already logged in: nothing to do here.
  if (await getAdminSession()) redirect("/admin");

  return (
    <Container width="form" className="py-12 md:py-20">
      <div className="rounded-md border border-line bg-surface p-6 md:p-8">
        <p className="text-sm font-semibold text-primary">{lawyer.name}</p>
        <h1 className="mt-1 text-2xl font-black text-ink">ورود به مدیریت وب‌سایت</h1>
        <LoginForm />
      </div>
    </Container>
  );
}
