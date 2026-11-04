import { AppShell } from "@/components/layout/app-shell";
import { PinFeed } from "@/components/pins/pin-feed";

export default function HomePage() {
  return (
    <AppShell>
      <PinFeed />
    </AppShell>
  );
}

export const metadata = {
  title: "Discover Pins",
};
