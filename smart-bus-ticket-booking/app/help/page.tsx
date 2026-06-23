import { StaticSitePage } from "@/components/static-site-page"
import Link from "next/link"

export default function HelpPage() {
  return (
    <StaticSitePage title="Help center">
      <p>
        Need help with booking, seats, or payments? Use the in-app Help button on the home page for quick tips,
        or review the FAQ.
      </p>
      <p>
        <Link href="/faq" className="text-primary underline underline-offset-4">
          Frequently asked questions
        </Link>
      </p>
      <p>
        <Link href="/contact" className="text-primary underline underline-offset-4">
          Contact us
        </Link>
      </p>
    </StaticSitePage>
  )
}
