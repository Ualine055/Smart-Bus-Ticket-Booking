"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  // localStorage and matchMedia only exist in the browser, so the saved theme
  // can only be read after mount - this is exactly what effects are for.
  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    const preferred = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(preferred)
    document.documentElement.classList.toggle("dark", preferred === "dark")
  }, [])

  const toggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light"
    setTheme(next)
    document.documentElement.classList.toggle("dark", next === "dark")
    localStorage.setItem("theme", next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
