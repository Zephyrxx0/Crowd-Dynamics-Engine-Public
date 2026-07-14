import { describe, it, expect } from "vitest";
import { createStore } from "zustand";
import { createAlertSlice, AlertSlice } from "@/stores/slices/alertSlice";
import { AlertEvent } from "@/types/alert";

// Use any to bypass the complex LiveStore type requirement for the test
const createMockStore = () => createStore<AlertSlice>((set, get, store) => createAlertSlice(set as any, get as any, store as any));

describe("alertSlice", () => {
  const makeMockAlert = (id: string): AlertEvent => ({
    id,
    severity: "warning",
    message: "test",
    timestamp: new Date().toISOString(),
  });

  it("addAlert appends alert to empty array", () => {
    const store = createMockStore();
    store.getState().addAlert(makeMockAlert("1"));
    
    const { alerts } = store.getState();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe("1");
  });

  it("adding 51 alerts keeps only the newest 50 (FIFO eviction)", () => {
    const store = createMockStore();
    for (let i = 1; i <= 51; i++) {
      store.getState().addAlert(makeMockAlert(i.toString()));
    }
    
    const { alerts } = store.getState();
    expect(alerts).toHaveLength(50);
    expect(alerts[0].id).toBe("2");
    expect(alerts[49].id).toBe("51");
  });

  it("clearAlerts empties alerts array", () => {
    const store = createMockStore();
    store.getState().addAlert(makeMockAlert("1"));
    store.getState().clearAlerts();
    
    expect(store.getState().alerts).toHaveLength(0);
  });

  it("alert ordering is preserved (newest appended last)", () => {
    const store = createMockStore();
    store.getState().addAlert(makeMockAlert("1"));
    store.getState().addAlert(makeMockAlert("2"));
    
    const { alerts } = store.getState();
    expect(alerts[0].id).toBe("1");
    expect(alerts[1].id).toBe("2");
  });

  it("exactly 50 alerts are kept when 50 added", () => {
    const store = createMockStore();
    for (let i = 1; i <= 50; i++) {
      store.getState().addAlert(makeMockAlert(i.toString()));
    }
    
    const { alerts } = store.getState();
    expect(alerts).toHaveLength(50);
    expect(alerts[0].id).toBe("1");
    expect(alerts[49].id).toBe("50");
  });
});
