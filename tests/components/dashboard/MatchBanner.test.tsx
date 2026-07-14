import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MatchBanner } from "@/components/dashboard/MatchBanner";
import * as liveStore from "@/stores/liveStore";

vi.mock("@/stores/liveStore", () => ({
  useLiveStore: vi.fn(),
}));

afterEach(() => {
  cleanup();
});


describe("MatchBanner", () => {
  it("Test 1: renders live state correctly", () => {
    vi.mocked(liveStore.useLiveStore).mockImplementation((selector: any) => {
      return selector({
        match: { score: "3 - 1", homeTeam: "Brazil", awayTeam: "Argentina", phase: "second-half", minute: 67 },
      });
    });
    render(<MatchBanner />);
    expect(screen.getByText("Brazil")).toBeInTheDocument();
    expect(screen.getByText("3 - 1")).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText("67'")).toBeInTheDocument();
    expect(screen.getByText("second-half")).toBeInTheDocument();
  });

  it("Test 2: renders loading state with Skeletons", () => {
    vi.mocked(liveStore.useLiveStore).mockImplementation((selector: any) => selector({ match: null }));
    const { container } = render(<MatchBanner isLoading={true} />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("Test 3: renders upcoming state", () => {
    vi.mocked(liveStore.useLiveStore).mockImplementation((selector: any) => selector({ match: null }));
    render(<MatchBanner upcomingMatch={{ homeTeam: "Germany", awayTeam: "France", localDate: "2026-06-12T12:00:00Z" }} />);
    expect(screen.getByText("Germany")).toBeInTheDocument();
    expect(screen.getByText("France")).toBeInTheDocument();
    expect(screen.getByText("UPCOMING")).toBeInTheDocument();
  });

  it("Test 4: renders error state with data", () => {
    vi.mocked(liveStore.useLiveStore).mockImplementation((selector: any) => selector({
        match: { score: "3 - 1", homeTeam: "Brazil", awayTeam: "Argentina", phase: "second-half", minute: 67 },
    }));
    render(<MatchBanner error="Match data unavailable — retrying..." />);
    expect(screen.getByText("Match data unavailable — retrying...")).toBeInTheDocument();
    expect(screen.getByText("3 - 1")).toBeInTheDocument(); 
  });

  it("Test 5: renders error state without data", () => {
    vi.mocked(liveStore.useLiveStore).mockImplementation((selector: any) => selector({ match: null }));
    render(<MatchBanner error="Match data unavailable — retrying..." />);
    expect(screen.getByText("Match data unavailable — retrying...")).toBeInTheDocument();
    expect(screen.queryByText("3 - 1")).not.toBeInTheDocument();
  });

  it("Test 6: renders empty state when both null", () => {
    vi.mocked(liveStore.useLiveStore).mockImplementation((selector: any) => selector({ match: null }));
    render(<MatchBanner />);
    expect(screen.getByText("No match data available")).toBeInTheDocument();
  });
});
