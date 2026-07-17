import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { GeistPixelCircle } from "geist/font/pixel"

import "./globals.css"

export const metadata: Metadata = {
  title: "Predictive Fan Flow Simulator",
  description: "Scenario-driven crowd risk simulation and planning",
}

import { MagneticDock } from "@/components/layout/MagneticDock"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistPixelCircle.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Header />
          <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
            {children}
          </div>
          <MagneticDock />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
