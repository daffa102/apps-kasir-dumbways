import { ArrowRight, Coffee } from "lucide-react";
import type { FormEvent } from "react";

type LoginPageProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
  errorMessage?: string | null;
};

export default function LoginPage({
  onSubmit,
  isLoading = false,
  errorMessage,
}: LoginPageProps) {
  return (
    <main className="min-h-screen bg-cream p-4 sm:p-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-5xl overflow-hidden rounded-[28px] border border-border bg-surface shadow-xl md:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-coffee p-10 text-white md:flex">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-coffee">
              <Coffee size={23} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <h1 className="mt-8 text-3xl font-bold tracking-tight">Kopora</h1>
            <p className="mt-2 max-w-xs text-sm leading-6 text-white/75">
              Satu tempat untuk mengelola operasional kafe.
            </p>
          </div>

          <div className="border-t border-white/15 pt-4 text-xs text-white/70">
            Cabang Senopati
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">
            <p className="text-sm font-semibold text-olive-dark">Kopora Coffee</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-coffee">
              Masuk ke akun staf
            </h2>
            <p className="mt-2 text-sm text-muted">
              Gunakan email dan kata sandi akun terdaftar.
            </p>

            <form className="mt-8 space-y-5" onSubmit={onSubmit}>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-coffee"
                  htmlFor="login-email"
                >
                  Email
                </label>
                <input
                  autoComplete="username"
                  className="w-full rounded-xl border border-border bg-cream/40 px-4 py-3 text-sm text-coffee outline-none transition focus:border-olive-dark focus:bg-white focus:ring-2 focus:ring-olive/15"
                  id="login-email"
                  name="email"
                  placeholder="nama@kopora.id"
                  required
                  type="email"
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-semibold text-coffee"
                  htmlFor="login-password"
                >
                  Kata sandi
                </label>
                <input
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-border bg-cream/40 px-4 py-3 text-sm text-coffee outline-none transition focus:border-olive-dark focus:bg-white focus:ring-2 focus:ring-olive/15"
                  id="login-password"
                  name="password"
                  placeholder="Masukkan kata sandi"
                  required
                  type="password"
                />
              </div>

              {errorMessage ? (
                <p className="text-sm font-medium text-red-700" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-olive-dark px-4 py-3 text-sm font-bold text-white transition hover:bg-coffee focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLoading}
                type="submit"
              >
                <span>{isLoading ? "Memeriksa akun..." : "Masuk"}</span>
                {!isLoading ? <ArrowRight size={17} aria-hidden="true" /> : null}
              </button>
            </form>

            <p className="mt-6 text-xs leading-5 text-muted">
              Hak akses ditentukan oleh peran akun yang terdaftar.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
