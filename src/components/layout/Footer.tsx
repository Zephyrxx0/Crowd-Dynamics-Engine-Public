import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full bg-[#e3d5ca] text-[#111111] py-16 mt-auto relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-10">
          <span
            className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111111]"
            style={{ fontFamily: "fixelPont, sans-serif" }}
          >
            Zephyrxx0
          </span>
          <p className="mt-3 text-sm text-[#111111]/70 max-w-md text-balance">
            Crowd dynamics engine for FIFA World Cup 2026 stadium operations — real-time simulation, AI alerts, and fan intelligence.
          </p>
        </div>
        <div className="h-px bg-[#111111]/15 mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#111111]/60">
          <p>&copy; 2026 Zephyrxx0</p>
          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/Zephyrxx0/Crowd-Dynamics-Engine-Public"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#111111] transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
