"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    updateConnection();
    window.addEventListener("offline", updateConnection);
    window.addEventListener("online", updateConnection);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }

    return () => {
      window.removeEventListener("offline", updateConnection);
      window.removeEventListener("online", updateConnection);
    };
  }, []);

  if (online) return null;

  return (
    <aside className="connection-status" role="status">
      <span>
        Você está sem conexão. Rascunhos da captura rápida continuam neste
        dispositivo.
      </span>
      <button onClick={() => window.location.reload()} type="button">
        Tentar novamente
      </button>
    </aside>
  );
}
