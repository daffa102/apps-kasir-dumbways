import axios from "axios";
import { Clock3, Coffee, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../../context/useAuth";
import { api, API_ORIGIN } from "../../lib/api";
import {
  kdsOrdersResponseSchema,
  type KdsOrder,
  type KdsOrderStatus,
} from "../../schemas/kds.schema";

type KdsFilter = "ALL" | KdsOrderStatus;
type SocketStatus = "connecting" | "connected" | "disconnected";

const filters: { value: KdsFilter; label: string }[] = [
  { value: "ALL", label: "Semua" },
  { value: "PENDING", label: "Menunggu" },
  { value: "IN_PROGRESS", label: "Diproses" },
  { value: "READY", label: "Siap" },
  { value: "COMPLETED", label: "Selesai" },
];

const statusLabels: Record<KdsOrderStatus, string> = {
  PENDING: "Menunggu",
  IN_PROGRESS: "Diproses",
  READY: "Siap disajikan",
  COMPLETED: "Selesai diambil",
};

const statusStyles: Record<KdsOrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  IN_PROGRESS: "bg-sky-100 text-sky-900",
  READY: "bg-emerald-100 text-emerald-900",
  COMPLETED: "bg-stone-200 text-stone-700",
};

const nextStatusByCurrent: Partial<Record<KdsOrderStatus, KdsOrderStatus>> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "READY",
  READY: "COMPLETED",
};

const actionLabels: Partial<Record<KdsOrderStatus, string>> = {
  PENDING: "Mulai racik",
  IN_PROGRESS: "Pesanan siap",
  READY: "Selesai diambil",
};

function getRequestErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ messages?: string }>(error)) {
    return (
      error.response?.data?.messages ??
      "Tidak dapat terhubung ke server. Coba muat ulang tiket."
    );
  }

  return "Terjadi kesalahan saat memuat KDS.";
}

function formatElapsed(createdAt: string, now: number): string {
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(createdAt).getTime()) / 1000),
  );
  const minutesText = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secondsText = String(seconds % 60).padStart(2, "0");

  return `${minutesText}:${secondsText}`;
}

export default function KdsPage() {
  const { logout, token, user } = useAuth();
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [filter, setFilter] = useState<KdsFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const requestSequence = useRef(0);

  const loadOrders = useCallback(async () => {
    const currentRequest = ++requestSequence.current;

    try {
      const response = await api.get<unknown>("/orders/kds");
      const result = kdsOrdersResponseSchema.safeParse(response.data);

      if (!result.success) {
        if (currentRequest === requestSequence.current) {
          setErrorMessage("Data tiket dari server tidak sesuai format.");
        }
        return;
      }

      if (currentRequest === requestSequence.current) {
        setErrorMessage(null);
        setOrders(result.data.data);
      }
    } catch (error: unknown) {
      if (currentRequest === requestSequence.current) {
        setErrorMessage(getRequestErrorMessage(error));
      }
    } finally {
      if (currentRequest === requestSequence.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!token || user?.role !== "BARISTA") return;

    const socket = io(API_ORIGIN, { auth: { token } });
    const handleOrdersUpdated = () => {
      setIsLoading(true);
      void loadOrders();
    };
    const handleConnected = () => setSocketStatus("connected");
    const handleDisconnected = () => setSocketStatus("disconnected");

    socket.on("connect", handleConnected);
    socket.on("disconnect", handleDisconnected);
    socket.on("connect_error", handleDisconnected);
    socket.on("kds:orders-updated", handleOrdersUpdated);
    const initialLoadTimer = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => {
      window.clearTimeout(initialLoadTimer);
      socket.off("connect", handleConnected);
      socket.off("disconnect", handleDisconnected);
      socket.off("connect_error", handleDisconnected);
      socket.off("kds:orders-updated", handleOrdersUpdated);
      socket.disconnect();
    };
  }, [token, user?.role, loadOrders]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const updateOrderStatus = async (order: KdsOrder) => {
    const nextStatus = nextStatusByCurrent[order.status];
    if (!nextStatus) return;

    setIsMutating(true);
    setErrorMessage(null);
    setNoticeMessage(null);

    try {
      await api.patch(`/orders/${order.id}/status`, { status: nextStatus });
      setIsLoading(true);
      setNoticeMessage(`Tiket diperbarui: ${statusLabels[nextStatus]}.`);
      await loadOrders();
    } catch (error: unknown) {
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      setIsMutating(false);
    }
  };

  const archiveOrder = async (orderId: string) => {
    setIsMutating(true);
    setErrorMessage(null);
    setNoticeMessage(null);

    try {
      await api.patch(`/orders/${orderId}/archive`);
      setIsLoading(true);
      setNoticeMessage("Tiket selesai berhasil diarsipkan.");
      await loadOrders();
    } catch (error: unknown) {
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      setIsMutating(false);
    }
  };

  const archiveCompletedOrders = async () => {
    setIsMutating(true);
    setErrorMessage(null);
    setNoticeMessage(null);

    try {
      const response = await api.patch<{
        success: true;
        data: { archivedCount: number };
      }>("/orders/kds/archive-completed", {});
      const count = response.data.data.archivedCount;
      setIsLoading(true);
      setNoticeMessage(`${count} tiket selesai dibersihkan dari papan.`);
      await loadOrders();
    } catch (error: unknown) {
      setErrorMessage(getRequestErrorMessage(error));
    } finally {
      setIsMutating(false);
    }
  };

  const visibleOrders = orders.filter(
    (order) => filter === "ALL" || order.status === filter,
  );
  const completedCount = orders.filter(
    (order) => order.status === "COMPLETED",
  ).length;

  return (
    <main className="min-h-dvh bg-cream p-4 text-coffee sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-olive/10 text-olive-dark">
              <Coffee size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Kopora · Barista
              </p>
              <h1 className="text-xl font-bold sm:text-2xl">Antrean pesanan</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-xs font-semibold">
              <span
                className={`h-2 w-2 rounded-full ${
                  socketStatus === "connected"
                    ? "bg-emerald-500"
                    : socketStatus === "connecting"
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
              />
              {socketStatus === "connected"
                ? "Realtime aktif"
                : socketStatus === "connecting"
                  ? "Menghubungkan..."
                  : "Realtime terputus · muat ulang tersedia"}
            </span>
            <span className="text-sm text-muted">{user?.name}</span>
            <button
              className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-cream"
              onClick={logout}
              type="button"
            >
              Keluar
            </button>
          </div>
        </header>

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 shadow-xs">
          <div
            aria-label="Filter tiket berdasarkan status"
            className="flex flex-wrap gap-2"
            role="group"
          >
            {filters.map((item) => {
              const count =
                item.value === "ALL"
                  ? orders.length
                  : orders.filter((order) => order.status === item.value).length;

              return (
                <button
                  aria-pressed={filter === item.value}
                  className={`min-h-11 touch-manipulation rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    filter === item.value
                      ? "bg-coffee text-white"
                      : "bg-cream text-coffee hover:bg-olive/10"
                  }`}
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  type="button"
                >
                  {item.label} <span className="ml-1 opacity-75">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-cream disabled:opacity-50"
              disabled={isLoading}
              onClick={() => {
                setIsLoading(true);
                void loadOrders();
              }}
              type="button"
            >
              <RefreshCw className={isLoading ? "animate-spin" : ""} size={16} />
              Muat ulang
            </button>
            <button
              className="inline-flex min-h-11 touch-manipulation items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isMutating || completedCount === 0}
              onClick={() => void archiveCompletedOrders()}
              type="button"
            >
              <Trash2 size={16} />
              Bersihkan selesai ({completedCount})
            </button>
          </div>
        </section>

        {errorMessage ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            <span>{errorMessage}</span>
            <button
              className="min-h-11 touch-manipulation font-bold underline"
              onClick={() => {
                setIsLoading(true);
                void loadOrders();
              }}
              type="button"
            >
              Coba lagi
            </button>
          </div>
        ) : null}

        {noticeMessage ? (
          <p
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            {noticeMessage}
          </p>
        ) : null}

        {isLoading && orders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center text-sm text-muted">
            Memuat tiket...
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface px-6 py-16 text-center">
            <p className="font-semibold text-coffee">
              {orders.length === 0
                ? "Belum ada tiket aktif."
                : "Tidak ada tiket pada status ini."}
            </p>
            <p className="mt-1 text-sm text-muted">
              Tiket hanya muncul setelah pembayaran berhasil.
            </p>
          </div>
        ) : (
          <section className="grid auto-rows-max content-start items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {visibleOrders.map((order) => {
              const nextStatus = nextStatusByCurrent[order.status];
              const elapsedSeconds = Math.max(
                0,
                Math.floor((now - new Date(order.createdAt).getTime()) / 1000),
              );
              const isOverdue =
                order.status !== "COMPLETED" && elapsedSeconds >= 8 * 60;

              return (
                <article
                  className={`flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-xs ${
                    isOverdue ? "border-red-300" : ""
                  }`}
                  key={order.id}
                >
                  <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                    <div className="min-w-0">
                      <p
                        className="truncate font-mono text-sm font-bold"
                        title={order.orderNumber}
                      >
                        #{order.orderNumber.slice(-8).toUpperCase()}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted">
                        {order.customerName} · {order.paymentMethod}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-[11px] font-bold ${statusStyles[order.status]}`}
                      >
                        {statusLabels[order.status]}
                      </span>
                      <p
                        className={`mt-1 inline-flex items-center gap-1 font-mono text-xs ${
                          isOverdue ? "font-bold text-red-700" : "text-muted"
                        }`}
                      >
                        <Clock3 size={13} aria-hidden="true" />
                        {formatElapsed(order.createdAt, now)}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-3 py-4">
                    {order.items.map((item) => (
                      <li className="text-sm" key={item.id}>
                        <p className="font-semibold">
                          <span className="mr-2 text-olive-dark">
                            {item.quantity}×
                          </span>
                          {item.menu.name}
                        </p>
                        {item.note ? (
                          <p className="mt-1 pl-7 text-xs text-muted">
                            Catatan: {item.note}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-border pt-3">
                    {nextStatus ? (
                      <button
                        className="min-h-11 touch-manipulation w-full rounded-xl bg-olive-dark px-4 py-3 text-sm font-bold text-white transition hover:bg-coffee disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isMutating}
                        onClick={() => void updateOrderStatus(order)}
                        type="button"
                      >
                        {isMutating
                          ? "Menyimpan..."
                          : actionLabels[order.status]}
                      </button>
                    ) : (
                      <button
                        className="inline-flex min-h-11 touch-manipulation w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isMutating}
                        onClick={() => void archiveOrder(order.id)}
                        type="button"
                      >
                        <Trash2 size={16} />
                        Arsipkan tiket
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
