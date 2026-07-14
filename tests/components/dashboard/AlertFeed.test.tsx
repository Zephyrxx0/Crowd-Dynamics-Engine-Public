import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import * as liveStore from "@/stores/liveStore";

describe("AlertFeed", () => {
  beforeEach(() => {
    class MockIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    window.IntersectionObserver = MockIntersectionObserver as any;
    
    // Mock scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockClearAlerts = vi.fn();

  const setupMockStore = (alerts: any[] = []) => {
    vi.spyOn(liveStore, "useLiveStore").mockImplementation((selector: any) => {
      const state = {
        alerts,
        clearAlerts: mockClearAlerts,
      };
      return selector(state);
    });
  };

  it("renders empty state when alerts array is empty", () => {
    setupMockStore([]);
    render(<AlertFeed />);
    
    expect(screen.getByText("No alerts yet — waiting for next analysis cycle")).toBeInTheDocument();
    
    const clearBtn = screen.getByRole("button", { name: /Clear All/i });
    expect(clearBtn).toBeDisabled();
  });

  it("renders nominal alerts with correct color treatment", () => {
    setupMockStore([
      { id: "1", severity: "nominal", message: "All good", timestamp: "2023-01-01T12:00:00Z" }
    ]);
    const { container } = render(<AlertFeed />);
    
    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(screen.getByText("NOMINAL")).toBeInTheDocument();
    
    const card = container.querySelector(".border-emerald-500");
    expect(card).toBeInTheDocument();
  });

  it("renders warning alerts with correct color treatment", () => {
    setupMockStore([
      { id: "1", severity: "warning", message: "Watch out", timestamp: "2023-01-01T12:00:00Z" }
    ]);
    const { container } = render(<AlertFeed />);
    
    expect(screen.getByText("Watch out")).toBeInTheDocument();
    expect(screen.getByText("WARNING")).toBeInTheDocument();
    
    const card = container.querySelector(".border-amber-500");
    expect(card).toBeInTheDocument();
  });

  it("renders critical alerts with correct color treatment", () => {
    setupMockStore([
      { id: "1", severity: "critical", message: "Danger", timestamp: "2023-01-01T12:00:00Z", zoneId: "north" }
    ]);
    const { container } = render(<AlertFeed />);
    
    expect(screen.getByText("Danger")).toBeInTheDocument();
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();
    expect(screen.getByText("[Zone: north]")).toBeInTheDocument();
    
    const card = container.querySelector(".border-red-500");
    expect(card).toBeInTheDocument();
  });

  it("'Clear All' button calls clearAlerts", () => {
    setupMockStore([
      { id: "1", severity: "warning", message: "Alert 1", timestamp: "2023-01-01T12:00:00Z" }
    ]);
    render(<AlertFeed />);
    
    const clearBtn = screen.getByRole("button", { name: /Clear All/i });
    expect(clearBtn).not.toBeDisabled();
    
    fireEvent.click(clearBtn);
    expect(mockClearAlerts).toHaveBeenCalledTimes(1);
  });

  it("disconnection notice banner appears when isDisconnected is true", () => {
    setupMockStore([]);
    render(<AlertFeed isDisconnected={true} />);
    
    expect(screen.getByText(/Alert feed disconnected — showing last received data/)).toBeInTheDocument();
  });
});
