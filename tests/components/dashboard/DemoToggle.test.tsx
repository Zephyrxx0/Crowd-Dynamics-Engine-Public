import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DemoToggle } from "@/components/dashboard/DemoToggle";

const mockIsDemo = vi.fn();
const mockSetIsDemo = vi.fn();
const mockResetAll = vi.fn();
const mockMatch = vi.fn();

vi.mock("@/stores/liveStore", () => ({
  useLiveStore: (selector: any) => selector({
    isDemo: mockIsDemo(),
    setIsDemo: mockSetIsDemo,
    resetAll: mockResetAll,
    match: mockMatch(),
  }),
}));

describe("DemoToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows Live and Demo buttons when match is null (no live data)", () => {
    mockIsDemo.mockReturnValue(false);
    mockMatch.mockReturnValue(null);
    render(<DemoToggle />);
    expect(screen.getByText("Live")).toBeDefined();
    expect(screen.getByText("Demo")).toBeDefined();
  });

  it("D-18-09 — returns null when match data is active and not in demo", () => {
    mockMatch.mockReturnValue({ score: "1-0", phase: "first-half" });
    mockIsDemo.mockReturnValue(false);
    const { container } = render(<DemoToggle />);
    expect(container.innerHTML).toBe("");
  });

  it("shows toggle when in demo mode even with match data (user can switch back)", () => {
    mockMatch.mockReturnValue({ score: "1-0" });
    mockIsDemo.mockReturnValue(true);
    render(<DemoToggle />);
    expect(screen.getByText("Live")).toBeDefined();
  });

  it("clicking Demo calls resetAll + setIsDemo(true) when currently Live", () => {
    mockIsDemo.mockReturnValue(false);
    mockMatch.mockReturnValue(null);
    render(<DemoToggle />);
    
    fireEvent.click(screen.getByText("Demo"));
    
    expect(mockResetAll).toHaveBeenCalledTimes(1);
    expect(mockSetIsDemo).toHaveBeenCalledWith(true);
  });

  it("clicking Live calls resetAll + setIsDemo(false) when currently Demo", () => {
    mockIsDemo.mockReturnValue(true);
    render(<DemoToggle />);
    
    fireEvent.click(screen.getByText("Live"));
    
    expect(mockResetAll).toHaveBeenCalledTimes(1);
    expect(mockSetIsDemo).toHaveBeenCalledWith(false);
  });
});
