import { ReactNode } from "react";

type AlertProps = {
  children: ReactNode;
  tone?: "info" | "error" | "success";
};

const toneStyles = {
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100",
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
};

export function Alert({ children, tone = "info" }: AlertProps) {
  return <div className={`rounded-md border px-4 py-3 text-sm ${toneStyles[tone]}`}>{children}</div>;
}
