import type { ReactNode } from "react";

import { AppNavigation } from "@/features/navigation/presentation/app-navigation";

type DashboardLayoutProperties = Readonly<{
  children: ReactNode;
}>;

export default function DashboardLayout({ children }: DashboardLayoutProperties) {
  return <AppNavigation>{children}</AppNavigation>;
}
