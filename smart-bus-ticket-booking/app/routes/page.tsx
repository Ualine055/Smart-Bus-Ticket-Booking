import { StaticSitePage } from "@/components/static-site-page"
import Link from "next/link"

export default function RoutesPage() {
  return (
    <StaticSitePage title="Popular routes">
      <p>
        Browse schedules and book from the home page. These routes are commonly available in the demo catalog:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Kigali → Musanze</li>
        <li>Kigali → Huye</li>
        <li>Kigali → Rusizi</li>
      </ul>
      <p>
        <Link href="/search" className="text-primary underline underline-offset-4">
          Find buses
        </Link>{" "}
        to see matching trips and prices.
      </p>
    </StaticSitePage>
  )
}
