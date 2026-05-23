import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import App from "../App";

export const Route = createFileRoute("/")({ component: IndexRoute });

function IndexRoute() {
  // App uses localStorage + HashRouter — render client-side only.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <div className="text-sm text-slate-500">Se încarcă LaZi…</div>
        </div>
      </div>
    );
  }
  return <App />;
}
