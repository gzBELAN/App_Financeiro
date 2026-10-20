"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  Menu,
  ReceiptText,
  Repeat2,
  Tags,
  Target,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

import { LogoutButton } from "@/features/auth/presentation/logout-button";

type NavigationItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Lançamentos", icon: ReceiptText },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/cards", label: "Cartões", icon: CreditCard },
  { href: "/installments", label: "Parcelamentos", icon: ListChecks },
  { href: "/subscriptions", label: "Assinaturas", icon: Repeat2 },
  { href: "/fixed-expenses", label: "Contas fixas", icon: WalletCards },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/workspace", label: "Compartilhar", icon: UsersRound },
];

function NavigationLinks({
  compact,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="space-y-1">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            } ${compact ? "justify-center px-2" : ""}`}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
            title={compact ? item.label : undefined}
          >
            <Icon aria-hidden="true" className="size-5 shrink-0" />
            <span className={compact ? "sr-only" : ""}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppNavigation({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4 lg:hidden">
        <button
          aria-label="Abrir menu"
          className="rounded-md border p-2 hover:bg-muted"
          onClick={() => setMobileOpen(true)}
          type="button"
        >
          <Menu className="size-5" />
        </button>
        <Link className="font-semibold tracking-tight text-primary" href="/dashboard">
          App Financeiro
        </Link>
      </header>
      {mobileOpen ? (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          type="button"
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-background p-3 transition-transform duration-200 lg:z-30 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "lg:w-20" : "lg:w-72"}`}
      >
        <div className={`mb-5 flex h-10 items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          <Link className={`font-semibold tracking-tight text-primary ${collapsed ? "hidden" : ""}`} href="/dashboard">
            App Financeiro
          </Link>
          <button
            aria-label="Fechar menu"
            className="rounded-md border p-2 hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            <X className="size-4" />
          </button>
          <button
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            className="hidden rounded-md border p-2 hover:bg-muted lg:block"
            onClick={() => setCollapsed((value) => !value)}
            type="button"
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>
        <NavigationLinks compact={collapsed} onNavigate={() => setMobileOpen(false)} />
        <div className={`mt-auto border-t pt-3 ${collapsed ? "flex justify-center" : ""}`}>
          <LogoutButton />
        </div>
      </aside>
      <main className={`transition-[margin] duration-200 ${collapsed ? "lg:ml-20" : "lg:ml-72"}`}>{children}</main>
    </div>
  );
}
