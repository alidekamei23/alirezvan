"use client";
// LoginForm — username and password for /admin/login. Errors come back from the server
// action; the message never says which of the two was wrong.
// Usage: <LoginForm />
import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type LoginState } from "@/app/admin/actions";
import { Alert } from "@/components/Alert";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";

const initial: LoginState = { error: null };

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="mt-6 flex flex-col gap-5">
      {state.error && (
        <Alert tone="danger" live>
          {state.error}
        </Alert>
      )}
      <TextField
        label="نام کاربری"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        dir="ltr"
        className="text-start"
        maxLength={100}
      />
      <TextField
        label="گذرواژه"
        name="password"
        type="password"
        autoComplete="current-password"
        dir="ltr"
        className="text-start"
      />
      <Button type="submit" loading={pending} icon={<LogIn />} fullWidth>
        ورود
      </Button>
    </form>
  );
}
