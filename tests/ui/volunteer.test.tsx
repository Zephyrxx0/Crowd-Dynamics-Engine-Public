import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import VolunteerPage from "@/app/(dashboard)/volunteer/page";
import { AssignedZoneWidget } from "@/components/volunteer/AssignedZoneWidget";
import { VolunteerScanner } from "@/components/volunteer/VolunteerScanner";

vi.mock("@/components/volunteer/AssignedZoneWidget", () => ({
  AssignedZoneWidget: vi.fn(() => <div data-testid="mock-zone-widget" />)
}));

vi.mock("@/components/volunteer/VolunteerScanner", () => ({
  VolunteerScanner: vi.fn(() => <div data-testid="mock-scanner" />)
}));

vi.mock("@/components/dashboard/AlertFeed", () => ({
  AlertFeed: vi.fn(() => <div data-testid="mock-alert-feed" />)
}));

describe("Volunteer Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the volunteer dashboard correctly", () => {
    render(<VolunteerPage />);
    
    expect(screen.getByText("Volunteer Portal")).toBeInTheDocument();
    expect(screen.getByText(/Gate C/)).toBeInTheDocument();
    expect(screen.getByText("Current Task")).toBeInTheDocument();
    
    expect(screen.getByTestId("mock-zone-widget")).toBeInTheDocument();
    expect(screen.getByTestId("mock-scanner")).toBeInTheDocument();
    expect(screen.getByTestId("mock-alert-feed")).toBeInTheDocument();
  });
});
