import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Provider } from "react-redux";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { store } from "@/store/store";
import { restoreSessionThunk } from "@/thunks/authThunks";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

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

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center soft-gradient px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-brand text-brand-foreground px-5 py-2.5 text-sm font-semibold"
          >
            Try again
          </button>
          <a href="/" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MediQueue — Clinical Appointment & Patient Flow" },
      {
        name: "description",
        content:
          "MediQueue is a hospital-grade SaaS for appointments, live patient queues and clinic operations.",
      },
      { property: "og:title", content: "MediQueue — Clinical Appointment & Patient Flow" },
      { property: "og:description", content: "Hospital-grade SaaS for appointments and patient flow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * AppGate — blocks rendering the app until session restoration is complete.
 *
 * On page refresh, Redux is cleared (in-memory). Without this gate,
 * AppShell would see `user = null` and immediately redirect to /login
 * before the async restoreSessionThunk() finishes.
 *
 * The gate:
 *  - If no refresh token exists → resolves instantly (no spinner flash)
 *  - If a token exists → waits for the restore promise to settle
 */
function AppGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hasToken =
      typeof window !== "undefined" &&
      !!localStorage.getItem("mediqueue.refresh_token");

    if (!hasToken) {
      // No token to restore — skip straight to ready
      setReady(true);
      return;
    }

    // Attempt session restore; mark ready when settled (success or failure)
    (dispatch(restoreSessionThunk()) as unknown as Promise<void>)
      .catch(() => {
        // Ignore errors, just mark as ready
      })
      .finally(() => {
        setReady(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

