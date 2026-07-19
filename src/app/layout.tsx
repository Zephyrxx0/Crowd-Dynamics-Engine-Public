import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { GeistPixelCircle, GeistPixelSquare, GeistPixelTriangle } from "geist/font/pixel"
import { GeistMono } from "geist/font/mono"

import "./globals.css"

export const metadata: Metadata = {
  title: {
    template: 'Flux | %s',
    default: 'Flux — Stadium Intelligence for FIFA World Cup 2026',
  },
  description:
    "GenAI-powered crowd dynamics engine for FIFA World Cup 2026: real-time crowd management, " +
    "fan navigation, accessibility routing, transport optimization, sustainability intelligence, " +
    "multilingual AI assistant, and operational decision support.",
  keywords: [
    "FIFA World Cup 2026",
    "crowd management",
    "stadium operations",
    "generative AI",
    "fan experience",
    "accessibility",
    "sustainability",
    "multilingual",
  ],
  icons: {
    icon: "/favicon.svg",
  },
}

import { MagneticDock } from "@/components/layout/MagneticDock"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { ChatPanel } from "@/components/fan/ChatPanel"
import { DynamicHtmlLang } from "@/components/DynamicHtmlLang"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistPixelCircle.variable} ${GeistPixelSquare.variable} ${GeistPixelTriangle.variable} ${GeistMono.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <DynamicHtmlLang />
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded"
          >
            Skip to main content
          </a>
          <Header />
          <div id="main-content" className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
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
