import { describe, it, expect } from 'vitest';
import { presets } from '@/simulation/presets';
import { simulateDeterministic } from '@/simulation/core/simulateDeterministic';

describe('Zone Data Server Spike', () => {
  it('computes zone density data server-side from presets without client dependencies', () => {
    // 1. & 2. Call simulateDeterministic(presets.normal)
    const output = simulateDeterministic(presets.normal);
    
    // 3. Assert output.phaseZoneMatrix is a non-empty array
    expect(output.phaseZoneMatrix).toBeInstanceOf(Array);
    expect(output.phaseZoneMatrix.length).toBeGreaterThan(0);

    // 4. & 6. Extract zone occupancy data
    const zoneCapacities = new Map(presets.normal.zones.map(z => [z.id, z.capacity]));
    const firstPhaseData = output.phaseZoneMatrix.filter(row => row.phaseId === presets.normal.phases[0].id);
    
    const zoneData = firstPhaseData.map(row => ({
      zoneId: row.zoneId,
      occupancyRatio: row.occupancyRatio,
      capacity: zoneCapacities.get(row.zoneId) ?? 0,
    }));

    expect(zoneData.length).toBeGreaterThan(0);
    expect(zoneData[0]).toHaveProperty('zoneId');
    expect(zoneData[0]).toHaveProperty('occupancyRatio');
    expect(zoneData[0]).toHaveProperty('capacity');

    // 5. Verify zone IDs match presets.normal.zones[*].id
    const presetZoneIds = presets.normal.zones.map(z => z.id);
    zoneData.forEach(zd => {
      expect(presetZoneIds).toContain(zd.zoneId);
    });

    // 7. No client-side errors implicitly verified by this running successfully.
  });
});
