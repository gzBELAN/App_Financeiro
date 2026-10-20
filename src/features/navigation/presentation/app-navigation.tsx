"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  ReceiptText,
  Repeat2,
  Tags,
  Target,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { LogoutButton } from "@/features/auth/presentation/logout-button";

type NavigationItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const navigationItems: NavigationItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Despesas", icon: ReceiptText },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/cards", label: "Cartões", icon: CreditCard },
  { href: "/installments", label: "Parcelamentos", icon: ListChecks },
  { href: "/subscriptions", label: "Assinaturas", icon: Repeat2 },
  { href: "/fixed-expenses", label: "Gastos fixos", icon: WalletCards },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/workspace", label: "Compartilhar", icon: UsersRound },
];

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex min-h-16 items-center gap-4 py-3">
        <Link className="shrink-0 font-semibold tracking-tight text-primary" href="/dashboard">
          App Financeiro
        </Link>
        <nav aria-label="Navegação principal" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
