"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let hasReloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hasReloaded) {
        hasReloaded = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      if (registration.waiting) setWaitingWorker(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) setWaitingWorker(worker);
        });
      });
    }).catch(() => {
      // A aplicação continua funcionando online caso o registro não seja possível.
    });
  }, []);

  if (!waitingWorker) return null;

  return <aside aria-live="polite" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-lg"><p className="text-sm">Uma nova versão do aplicativo está disponível.</p><button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" onClick={() => waitingWorker.postMessage({ type: "SKIP_WAITING" })} type="button">Atualizar agora</button></aside>;
}