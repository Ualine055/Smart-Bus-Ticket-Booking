"use client"

import { SiteShell } from "@/components/site-shell"

type StaticSitePageProps = {
  title: string
  children: React.ReactNode
}

/** Shared layout for informational routes linked from the footer (same chrome as the app, no visual redesign). */
export function StaticSitePage({ title, children }: StaticSitePageProps) {
  return (
    <SiteShell>
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-foreground">{title}</h1>
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
      </main>
    </SiteShell>
  )
}
