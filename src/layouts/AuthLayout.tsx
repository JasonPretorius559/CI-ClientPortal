import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

type AuthLayoutProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen bg-surface-canvas lg:grid-cols-[minmax(380px,0.92fr)_minmax(520px,1.08fr)]">
      <section className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-40 -top-48 h-[34rem] w-[34rem] rounded-full bg-white/[0.06] blur-3xl" />
        <div className="absolute -bottom-56 -left-40 h-[30rem] w-[30rem] rounded-full border-[80px] border-white/[0.04]" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/10">
            <span className="text-sm font-extrabold tracking-[-0.04em]">CI</span>
          </span>
          <div>
            <p className="font-bold tracking-[-0.02em]">Cloud Insure</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Operations portal</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Decision intelligence</p>
          <h2 className="mt-5 text-5xl font-semibold leading-[0.98] tracking-[-0.06em] xl:text-6xl">
            Every conclusion, connected to its evidence.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/55">
            A focused workspace for defensible insurance analysis, structured review, and auditable decisions.
          </p>
        </div>

        <div className="relative flex items-center gap-3 border-t border-white/10 pt-5 text-xs text-white/40">
          <span className="h-2 w-2 rounded-full bg-success-500" />
          Secure analysis workspace
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="mb-7 flex items-center gap-3 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-700 text-xs font-extrabold text-white">CI</span>
              <p className="font-bold text-ink-950">Cloud Insure</p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">Welcome to the analysis desk</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-ink-950">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-ink-600">{description}</p>
          </div>
          <div className="rounded-[1.35rem] border border-surface-line bg-white p-6 shadow-panel sm:p-7">{children ?? <Outlet />}</div>
        </div>
      </section>
    </main>
  );
}
