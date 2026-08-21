"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { StaticSitePage } from "@/components/static-site-page"
import { getActiveRoutes } from "@/lib/schedules"

type Route = { from: string; to: string; operators: number; fromPrice: number }

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveRoutes().then((result) => {
      setRoutes(result.routes)
      setLoading(false)
    })
  }, [])

  return (
    <StaticSitePage title="Available routes">
      {loading ? (
        <p>Loading routes...</p>
      ) : routes.length === 0 ? (
        <p>
          No operator has published a schedule yet. Once bus companies register and add their
          departures, their routes appear here automatically.
        </p>
      ) : (
        <>
          <p>These routes are currently served by registered operators:</p>
          <ul className="list-disc pl-6 space-y-2">
            {routes.map((route) => (
              <li key={`${route.from}-${route.to}`}>
                {route.from} → {route.to} — {route.operators}{" "}
                {route.operators === 1 ? "operator" : "operators"}, from{" "}
                {route.fromPrice.toLocaleString()} RWF
              </li>
            ))}
          </ul>
        </>
      )}
      <p>
        <Link href="/search" className="text-primary underline underline-offset-4">
          Find buses
        </Link>{" "}
        to see matching trips and prices.
      </p>
    </StaticSitePage>
  )
}
