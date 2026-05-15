import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/doctor")({
  component: () => (
    <AppShell role="doctor">
      <Outlet />
    </AppShell>
  ),
});
