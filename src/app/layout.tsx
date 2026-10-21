import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "App Financeiro",
    template: "%s | App Financeiro",
  },
  description: "Controle financeiro pessoal simples, seguro e responsivo.",
  applicationName: "App Financeiro",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "App Financeiro",
  },
  icons: {
    apple: "/icons/icon-192.svg",
    icon: [
      { type: "image/svg+xml", url: "/icons/icon-192.svg" },
      { type: "image/svg+xml", url: "/icons/icon-512.svg" },
    ],
  },
};

type RootLayoutProperties = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProperties) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const preference = localStorage.getItem("app-financeiro-theme") || "system";
                const isDark = preference === "dark" || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                document.documentElement.classList.toggle("dark", isDark);
              } catch { /* A aparência padrão será usada quando o armazenamento não estiver disponível. */ }
            })();`,
          }}
        />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}