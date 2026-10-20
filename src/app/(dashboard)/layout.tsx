import type { ReactNode } from "react";

import { AppNavigation } from "@/features/navigation/presentation/app-navigation";

type DashboardLayoutProperties = Readonly<{
  children: ReactNode;
}>;

export default function DashboardLayout({ children }: DashboardLayoutProperties) {
  return (
    <div className="min-h-screen bg-muted/30">
      <AppNavigation />
      {children}
    </div>
  );
}
