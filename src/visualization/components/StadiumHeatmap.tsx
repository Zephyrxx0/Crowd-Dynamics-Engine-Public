import { animate } from "animejs"
import { useEffect, useRef, useState } from "react"

import type { LatestZoneRisk } from "@/visualization/selectors/buildVisualizationModel"
import {
  PREFERS_REDUCED_MOTION,
  VISUALIZATION_EASE,
  VISUALIZATION_TRANSITION_MS,
} from "@/visualization/contracts/motionPolicy"
import { riskBandFromRatio, RISK_LEGEND } from "@/visualization/contracts/riskEncoding"
import { STADIUM_ZONE_POLYGONS } from "@/visualization/contracts/stadiumPolygons"
import { useLiveStore } from "@/stores/liveStore"

type StadiumHeatmapProps = {
  latestZoneRisk: Record<string, LatestZoneRisk>
}

const NO_DATA_FILL = "#cbd5e1"

function colorForBand(band: "green" | "amber" | "red" | "critical") {
  return RISK_LEGEND.find((entry) => entry.band === band)?.color ?? NO_DATA_FILL
}

export function StadiumHeatmap({ latestZoneRisk }: StadiumHeatmapProps) {
  const highlightedZone = useLiveStore((s) => s.highlightedZone)
  const polygonRefs = useRef(new Map<string, SVGPolygonElement>())
  const reducedMotion = PREFERS_REDUCED_MOTION()
  const polygonZoneIds = Object.keys(STADIUM_ZONE_POLYGONS)
  const unmappedZones = Object.keys(latestZoneRisk)
    .filter((zoneId) => !STADIUM_ZONE_POLYGONS[zoneId])
    .sort((left, right) => left.localeCompare(right))

  useEffect(() => {
    const duration = reducedMotion ? 0 : VISUALIZATION_TRANSITION_MS

    for (const zoneId of polygonZoneIds) {
      const node = polygonRefs.current.get(zoneId)
      if (!node) {
        continue
      }

      const isNoData = !latestZoneRisk[zoneId]
      if (reducedMotion) {
        node.style.opacity = isNoData ? "0.78" : "1"
        node.style.strokeWidth = isNoData ? "1.5" : "2"
        node.style.transitionDuration = "0ms"
        continue
      }

      node.style.transitionDuration = `${duration}ms`
      animate(node, {
        opacity: [0.45, isNoData ? 0.78 : 1],
        strokeWidth: [1, isNoData ? 1.5 : 2],
        duration,
        ease: VISUALIZATION_EASE,
      })
    }
  }, [latestZoneRisk, polygonZoneIds, reducedMotion])

  useEffect(() => {
    if (!highlightedZone || reducedMotion) {
      return
    }

    const node = polygonRefs.current.get(highlightedZone)
    if (!node) {
      return
    }

    animate(node, {
      opacity: [1, 0.55, 1],
      scale: [1, 1.08, 1],
      duration: 800,
      loop: 3,
      ease: "inOutQuad",
    })
  }, [highlightedZone, reducedMotion])

  const [showAccessibility, setShowAccessibility] = useState(false);

  return (
    <section className="space-y-3" data-testid="stadium-heatmap">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-white">Stadium Risk Heatmap</h3>
        <button 
          onClick={() => setShowAccessibility(!showAccessibility)}
          className={`text-xs px-2 py-1 rounded border ${showAccessibility ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
        >
          {showAccessibility ? "Hide Accessible Routes" : "Show Accessible Routes"}
        </button>
      </div>

      <svg
        viewBox="0 0 600 380"
        role="img"
        aria-label="Stadium silhouette heatmap"
        data-testid="stadium-heatmap-svg"
        data-transition-ms={VISUALIZATION_TRANSITION_MS}
        data-reduced-motion={String(reducedMotion)}
      >
        <rect x="0" y="0" width="600" height="380" rx="40" fill="#020617" />
        
        {/* Pitch */}
        <rect x="130" y="110" width="340" height="160" fill="#064e3b" />
        {/* Pitch Lines */}
        <rect x="130" y="110" width="340" height="160" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
        <line x1="300" y1="110" x2="300" y2="270" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
        <circle cx="300" cy="190" r="30" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
        <rect x="130" y="145" width="45" height="90" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
        <rect x="425" y="145" width="45" height="90" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
        
        <g data-testid="stadium-heatmap-zones">
        {polygonZoneIds.map((zoneId) => {
          const polygon = STADIUM_ZONE_POLYGONS[zoneId]
          const latest = latestZoneRisk[zoneId]

          if (!latest) {
            return (
              <polygon
                key={zoneId}
                points={polygon}
                fill={NO_DATA_FILL}
                stroke="#94a3b8"
                strokeWidth="2"
                data-testid={`heatmap-zone-${zoneId}`}
                data-zone-id={zoneId}
                data-risk-band="no-data"
                className={zoneId === highlightedZone ? "drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]" : undefined}
                ref={(node) => {
                  if (node) {
                    polygonRefs.current.set(zoneId, node)
                  } else {
                    polygonRefs.current.delete(zoneId)
                  }
                }}
              />
            )
          }

          const riskBand = riskBandFromRatio(latest.occupancyRatio)
          return (
            <polygon
              key={zoneId}
              points={polygon}
              fill={colorForBand(riskBand)}
              stroke="#0f172a"
              strokeWidth="2"
              data-testid={`heatmap-zone-${zoneId}`}
              data-zone-id={zoneId}
              data-risk-band={riskBand}
              className={zoneId === highlightedZone ? "drop-shadow-[0_0_12px_rgba(59,130,246,0.9)]" : undefined}
              ref={(node) => {
                if (node) {
                  polygonRefs.current.set(zoneId, node)
                } else {
                  polygonRefs.current.delete(zoneId)
                }
              }}
            />
          )
        })}
        </g>

        {/* Accessibility Routes Overlay */}
        {showAccessibility && (
          <g data-testid="accessibility-routes">
            {/* North Gate to Pitch Accessible Ramp */}
            <path d="M 300 50 L 300 90 Q 300 110 320 110 L 400 110" fill="none" stroke="#2563eb" strokeWidth="4" strokeDasharray="6,4" opacity="0.8" />
            <circle cx="300" cy="50" r="6" fill="#2563eb" />
            
            {/* South Gate to Concourse Elevator */}
            <path d="M 300 330 L 300 290 Q 300 270 280 270 L 200 270" fill="none" stroke="#2563eb" strokeWidth="4" strokeDasharray="6,4" opacity="0.8" />
            <circle cx="300" cy="330" r="6" fill="#2563eb" />
            <rect x="190" y="260" width="10" height="20" fill="#2563eb" />
            
            {/* Accessible Seating Area */}
            <rect x="250" y="80" width="100" height="15" fill="#3b82f6" opacity="0.5" />
          </g>
        )}
      </svg>

      <p className="text-xs text-white">Grey regions indicate no current simulation data for that zone.</p>

      <div data-testid="heatmap-unmapped-zones" className="text-xs text-white" aria-live="polite">
        {unmappedZones.length > 0 ? `Unmapped zones: ${unmappedZones.join(", ")}` : "All zones are mapped to the stadium silhouette."}
      </div>
    </section>
  )
}
