import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Coffee,
  Receipt,
  ChartNoAxesCombined,
  Package,
  Users,
  Clock3,
  Settings,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

const navigation = [
  {
    title: "Operasional",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/" },
      { label: "Kasir", icon: ShoppingCart, href: "/pos" },
      { label: "Pesanan", icon: ClipboardList, href:"/orders" },
      { label: "Menu & Kategori", icon: Coffee, href:"/menu" },
      { label: "Transaksi", icon: Receipt, href: "/transactions" },
    ],
  },
  {
    title: "Manajemen",
    items: [
      { label: "Laporan", icon: ChartNoAxesCombined, href: "/reports" },
      { label: "Stok Bahan", icon: Package, href: "/inventory" },
      { label: "Pengguna", icon: Users, href: "/users" },
      { label: "Shift Kasir", icon: Clock3, href: "/shifts" },
      { label: "Pengaturan", icon: Settings, href: "/settings" },
    ],
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          aria-label="Tutup navigasi"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >

      <div className="flex h-20 items-center justify-between border-b border-border px-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-olive-dark">
            KOPORA
          </h1>
          <p className="text-xs text-muted">Cafe Operation</p>
        </div>

        <button
          aria-label="Tutup navigasi"
          onClick={onClose}
          className="rounded-lg p-2 text-muted hover:bg-cream lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {navigation.map((group) => (
          <section key={group.title}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      item.href === "/"
                        ? "bg-olive/10 text-olive-dark"
                        : "text-muted hover:bg-cream hover:text-coffee"
                    }`}
                  >
                    <Icon size={19} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="border-t border-border p-4">
          <p className="text-sm font-semibold text-coffee">Kopora Roastery</p>
          <p className="mt-1 text-xs text-muted">Cafe Management</p>
        </div>

        </aside>
    </>
  );
}
