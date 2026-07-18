import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AlertFeed } from "@/components/dashboard/AlertFeed"
import * as liveStore from "@/stores/liveStore"
import type { AlertEvent } from "@/types/alert"

const clearAlerts = vi.fn()

function mockAlerts(alerts: AlertEvent[]) {
  vi.spyOn(liveStore, "useLiveStore").mockImplementation((selector) =>
    selector({
      alerts,
      clearAlerts,
    } as unknown as liveStore.LiveStore),
  )
}

describe("AlertFeed accessibility states", () => {
  beforeEach(() => {
    class MockIntersectionObserver {
      observe() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    clearAlerts.mockClear()
  })

  it("renders empty state when no alerts", () => {
    mockAlerts([])
    render(React.createElement(AlertFeed))

    expect(screen.getByText("No alerts yet — waiting for next analysis cycle")).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Live alerts" })).toHaveAttribute("aria-live", "polite")
  })

  it("renders alerts list when populated", () => {
    mockAlerts([
      { id: "a1", severity: "warning", message: "Gate pressure rising", timestamp: "2026-01-01T12:00:00Z" },
    ])
    render(React.createElement(AlertFeed))

    expect(screen.getByText("Gate pressure rising")).toBeInTheDocument()
    expect(screen.getByText("warning")).toBeInTheDocument()
  })

  it("renders critical alerts with elevated styling", () => {
    mockAlerts([
      { id: "a1", severity: "critical", message: "Evacuate west gate", timestamp: "2026-01-01T12:00:00Z" },
    ])
    const { container } = render(React.createElement(AlertFeed))

    expect(screen.getByText("critical")).toBeInTheDocument()
    expect(container.querySelector("[class*='bg-red-500']")).toBeInTheDocument()
  })

  it("derives aria-live from severity", () => {
    mockAlerts([
      { id: "a1", severity: "critical", message: "Crowding critical", timestamp: "2026-01-01T12:00:00Z" },
    ])
    render(React.createElement(AlertFeed))

    expect(screen.getByRole("region", { name: "Live alerts" })).toHaveAttribute("aria-live", "assertive")
    expect(screen.getByRole("alert")).toHaveAttribute("aria-atomic", "true")
  })
})
