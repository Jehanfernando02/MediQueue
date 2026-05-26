import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext } from "@tanstack/react-router";
import { Provider } from "react-redux";
import { useEffect, useState } from "react";

import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { store } from "@/store/store";
import { restoreSessionThunk } from "@/thunks/authThunks";
import { useAppDispatch } from "@/store/hooks";

// ---------------------------------------------------------------------------
// 404
// ---------------------------------------------------------------------------
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center soft-gradient px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold tracking-tight text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-brand text-brand-foreground px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105 shadow-lg shadow-brand/25"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error boundary
// ---------------------------------------------------------------------------
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center soft-gradient px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={reset}
            className="rounded-full bg-brand text-brand-foreground px-5 py-2.5 text-sm font-semibold"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route definition
// NO shellComponent / HeadContent / Scripts — those are TanStack Start SSR
// APIs that do not exist in plain @tanstack/react-router SPA builds.
// Using them in a Vite SPA causes silent hydration failure on every route
// except "/" because the server returns empty HTML that React can't mount.
// ---------------------------------------------------------------------------
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// ---------------------------------------------------------------------------
// AppGate — blocks rendering until session restoration settles.
//
// Lazy useState initializer computes the correct starting value
// synchronously — so the spinner never flashes for auth pages or
// users with no stored token.
// ---------------------------------------------------------------------------
function AppGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  const [ready, setReady] = useState(() => {
    const isAuthPage =
      window.location.pathname === "/login" ||
      window.location.pathname === "/register";
    const hasToken = !!localStorage.getItem("mediqueue.refresh_token");
    // Ready immediately — no restore needed
    return isAuthPage || !hasToken;
  });

  useEffect(() => {
    // If already ready (auth page or no token), skip
    if (ready) return;

    const timeout = setTimeout(() => setReady(true), 5000);

    (dispatch(restoreSessionThunk()) as unknown as Promise<void>)
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeout);
        setReady(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          <p className="mt-4 text-white text-sm">Restoring your session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------
function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppGate>
            <Outlet />
            <Toaster richColors position="top-right" />
          </AppGate>
        </AuthProvider>
      </QueryClientProvider>
    </Provider>
  );
}