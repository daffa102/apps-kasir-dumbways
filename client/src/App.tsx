import axios from "axios";
import { useState, type FormEvent } from "react";
import LoginPage from "./components/auth/LoginPage";
import { useAuth } from "./context/useAuth";
import KdsPage from "./components/kds/KdsPage";
import { api } from "./lib/api";
import {
  loginResponseSchema,
  loginSchema,
} from "./schemas/auth.schema";

function App() {
  const { isInitializing, login, logout, user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const validation = loginSchema.safeParse({ email, password });

    if (!validation.success) {
      setErrorMessage(
        validation.error.issues[0]?.message ?? "Data login tidak valid",
      );
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login", validation.data);
      const result = loginResponseSchema.safeParse(response.data);

      if (!result.success) {
        setErrorMessage("Balasan login dari server tidak valid.");
        return;
      }

      login(result.data.token, result.data.user);
    } catch (error: unknown) {
      if (axios.isAxiosError<{ messages?: string }>(error)) {
        setErrorMessage(
          error.response?.data?.messages ??
            "Tidak dapat terhubung ke server. Pastikan backend berjalan.",
        );
      } else {
        setErrorMessage("Terjadi kesalahan saat login.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-cream p-6 text-coffee">
        Memeriksa sesi...
      </main>
    );
  }

  if (user?.role === "BARISTA") {
    return <KdsPage />;
  }

  if (user) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-cream p-6 text-coffee">
        <section className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-lg">
          <p className="text-sm font-semibold text-olive-dark">Sesi aktif</p>
          <h1 className="mt-2 text-2xl font-bold">{user.name}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
          <p className="mt-4 text-sm">
            Peran akun: <strong>{user.role}</strong>
          </p>
          <button
            className="mt-8 w-full rounded-xl bg-olive-dark px-4 py-3 text-sm font-bold text-white hover:bg-coffee"
            onClick={logout}
            type="button"
          >
            Keluar
          </button>
        </section>
      </main>
    );
  }

  return (
    <LoginPage
      errorMessage={errorMessage}
      isLoading={isLoading}
      onSubmit={handleSubmit}
    />
  );
}

export default App;
