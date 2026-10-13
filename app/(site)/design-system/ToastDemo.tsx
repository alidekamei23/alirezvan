"use client";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";

export function ToastDemo() {
  const toast = useToast();
  return (
    <Button variant="secondary" onClick={() => toast("نتیجه کپی شد.")}>
      نمایش پیام
    </Button>
  );
}
