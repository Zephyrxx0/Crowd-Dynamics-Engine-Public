"use client"

import { useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger)
}

export function Footer() {
  const containerRef = useRef<HTMLElement>(null)
  const text = "Zephyrxx0"

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%",
      },
      repeat: -1,
      repeatDelay: 0.5,
    })

    // 1. Entrance animation - letters fall in with bounce
    tl.fromTo(".footer-letter", {
      y: -100,
      x: 0,
      opacity: 0,
      scale: 1.5,
      rotation: () => gsap.utils.random(-30, 30),
    }, {
      y: 0,
      x: 0,
      opacity: 1,
      scale: 1,
      rotation: 0,
      duration: 1,
      stagger: 0.08,
      ease: "back.out(1.7)",
    })

    // 2. Pause before exit
    tl.to({}, { duration: 3.5 })

    // 3. Fall down - letters drop with gravity
    tl.to(".footer-letter", {
      y: 300,
      opacity: 0,
      scale: 0.4,
      rotation: () => gsap.utils.random(-30, 30),
      duration: 0.6,
      stagger: 0.02,
      ease: "power2.in",
    })
  }, { scope: containerRef })

  return (
    <footer ref={containerRef} className="w-full bg-[#111111] dark:bg-[#e3d5ca] text-[#e3d5ca] dark:text-[#111111] py-24 mt-auto relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-10">
          <span
            className="flex flex-wrap justify-center text-[12rem] sm:text-15xl font-bold tracking-tight text-[#e3d5ca] dark:text-[#111111]"
            style={{ fontFamily: "fixelPont, sans-serif" }}
          >
            {text.split("").map((char, index) => (
              <span key={index} className="footer-letter inline-block transform-gpu">
                {char}
              </span>
            ))}
          </span>
          <p className="mt-3 text-sm text-[#e3d5ca]/70 dark:text-[#111111]/70 max-w-md text-balance">
            Crowd dynamics engine for FIFA World Cup 2026 stadium operations — real-time simulation, AI alerts, and fan intelligence.
          </p>
        </div>
        <div className="h-px bg-[#e3d5ca]/15 dark:bg-[#111111]/15 mb-6" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-[#e3d5ca]/60 dark:text-[#111111]/60">
          <p>&copy; 2026 Zephyrxx0</p>
          <div className="flex items-center gap-6">
            <Link
              href="https://github.com/Zephyrxx0/Crowd-Dynamics-Engine-Public"
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#e3d5ca] dark:hover:text-[#111111] transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
