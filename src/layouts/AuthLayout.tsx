import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

type AuthLayoutProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-lg font-bold tracking-tight text-ink-950">Cloud Insure</p>
          <h1 className="mt-3 text-3xl font-bold text-ink-950">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-ink-600">{description}</p>
        </div>
        <div className="rounded-lg border border-ink-200 bg-white p-6 shadow-soft">{children ?? <Outlet />}</div>
      </div>
    </main>
  );
}
