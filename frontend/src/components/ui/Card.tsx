import { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {title ? <h2 className="mb-3 text-base font-semibold">{title}</h2> : null}
      {children}
    </section>
  );
}
