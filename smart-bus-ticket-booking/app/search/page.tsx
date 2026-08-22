import type { Metadata } from "next"
import { HomePageContent } from "@/components/home-page-content"

export const metadata: Metadata = {
  title: "Find buses - BUS CONNECT",
  description: "Search buses by route and date, choose your seat, and book a ticket.",
}

/**
 * Deep link straight to the search form. Renders the same booking flow as the
 * home page but scrolls past the introduction, so "Find buses" links and
 * shared URLs land on the form itself.
 */
export default function SearchPage() {
  return <HomePageContent scrollToSearch />
}
