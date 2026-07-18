import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { GeistPixelCircle, GeistPixelSquare, GeistPixelTriangle } from "geist/font/pixel"
import { GeistMono } from "geist/font/mono"

import "./globals.css"

export const metadata: Metadata = {
  title: {
    template: 'Flux | %s',
    default: 'Flux',
  },
  description: "Scenario-driven crowd risk simulation and planning",
  icons: {
    icon: "/favicon.svg",
  },
}

import { MagneticDock } from "@/components/layout/MagneticDock"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ChatPanel } from "@/components/fan/ChatPanel"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistPixelCircle.variable} ${GeistPixelSquare.variable} ${GeistPixelTriangle.variable} ${GeistMono.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Header />
          <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
            {children}
          </div>
          <MagneticDock />
          <ChatPanel />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
