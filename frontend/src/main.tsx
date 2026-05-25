import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import "./styles.css";

// Import routes
import { routeTree } from "./routeTree.gen";

// Create router with context
const router = createRouter({
  routeTree,
  context: {
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes
          refetchOnWindowFocus: false,
        },
      },
    }),
  },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
  defaultPreload: "intent",
});

// Register router for TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render app
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
