import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ho.ME",
    template: "%s | Ho.ME",
  },
  description: "House Management Environment para uma rotina financeira doméstica mais inteligente.",
  applicationName: "Ho.ME",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ho.ME",
  },
  icons: {
    apple: "/icons/icon-192.svg",
    icon: [
      { type: "image/svg+xml", url: "/icons/icon-192.svg" },
      { type: "image/svg+xml", url: "/icons/icon-512.svg" },
    ],
  },
};

export const viewport: Viewport = {
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  width: "device-width",
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
                const preference = localStorage.getItem("home-theme") || localStorage.getItem("app-financeiro-theme") || "system";
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