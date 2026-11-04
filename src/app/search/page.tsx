import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { SearchResults } from "@/components/search-results";

export const metadata: Metadata = {
  title: "Search",
};

export default function SearchPage() {
  return (
    <AppShell>
      <SearchResults />
    </AppShell>
  );
}
