import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DemoModeBanner } from "@/components/dashboard/DemoModeBanner";

const mockIsDemo = vi.fn();
vi.mock("@/stores/liveStore", () => ({
  useLiveStore: (selector: any) => selector({ isDemo: mockIsDemo() }),
}));

describe("DemoModeBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders DEMO MODE banner when isDemo=true", () => {
    mockIsDemo.mockReturnValue(true);
    render(<DemoModeBanner />);
    expect(screen.getByText(/DEMO MODE/i)).toBeDefined();
  });

  it("returns null when isDemo=false", () => {
    mockIsDemo.mockReturnValue(false);
    const { container } = render(<DemoModeBanner />);
    expect(container.innerHTML).toBe("");
  });
});
