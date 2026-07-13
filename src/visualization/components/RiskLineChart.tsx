import { animate } from "animejs"
import { line, scaleLinear, scalePoint } from "d3"
import { useEffect, useMemo, useRef, useState } from "react"

import type { SimulationOutput } from "@/simulation/contracts/output.schema"
import {
  PREFERS_REDUCED_MOTION,
  VISUALIZATION_EASE,
  VISUALIZATION_TRANSITION_MS,
} from "@/visualization/contracts/motionPolicy"
import { RISK_LEGEND } from "@/visualization/contracts/riskEncoding"
import { buildVisualizationModel } from "@/visualization/selectors/buildVisualizationModel"
import { TopZonesToggle } from "./TopZonesToggle"

type RiskLineChartProps = {
  output: SimulationOutput
}

const CHART_SIZE = {
  width: 760,
  height: 320,
  marginTop: 24,
  marginRight: 20,
  marginBottom: 48,
  marginLeft: 52,
}

const TOP_ZONE_COUNT = 5

function colorForBand(band: "green" | "amber" | "red") {
  return RISK_LEGEND.find((entry) => entry.band === band)?.color ?? "#64748b"
}

export function RiskLineChart({ output }: RiskLineChartProps) {
  const [showAllZones, setShowAllZones] = useState(false)
  const pathRefs = useRef(new Map<string, SVGPathElement>())
  const model = useMemo(() => buildVisualizationModel(output), [output])
  const reducedMotion = PREFERS_REDUCED_MOTION()

  const allZoneIds = useMemo(() => Object.keys(model.zoneSeries), [model.zoneSeries])
  const topZoneIds = useMemo(() => model.topZoneIds.slice(0, TOP_ZONE_COUNT), [model.topZoneIds])
  const visibleZoneIds = showAllZones ? allZoneIds : topZoneIds

  const xScale = useMemo(
    () =>
      scalePoint<string>()
        .domain(model.phaseOrder)
        .range([
          CHART_SIZE.marginLeft,
          CHART_SIZE.width - CHART_SIZE.marginRight,
        ]),
    [model.phaseOrder],
  )

  const yScale = useMemo(
    () =>
      scaleLinear()
        .domain([0, 1])
        .range([
          CHART_SIZE.height - CHART_SIZE.marginBottom,
          CHART_SIZE.marginTop,
        ]),
    [],
  )

  const lineBuilder = useMemo(
    () =>
      line<{ phaseId: string; occupancyRatio: number }>()
        .x((point: { phaseId: string; occupancyRatio: number }) => xScale(point.phaseId) ?? CHART_SIZE.marginLeft)
        .y((point: { phaseId: string; occupancyRatio: number }) => yScale(point.occupancyRatio)),
    [xScale, yScale],
  )

  useEffect(() => {
    const duration = reducedMotion ? 0 : VISUALIZATION_TRANSITION_MS

    for (const zoneId of visibleZoneIds) {
      const node = pathRefs.current.get(zoneId)
      if (!node) {
        continue
      }

      const targetOpacity = showAllZones && !topZoneIds.includes(zoneId) ? 0.45 : 1

      if (reducedMotion) {
        node.style.opacity = String(targetOpacity)
        node.style.strokeWidth = "2"
        node.style.transitionDuration = "0ms"
        continue
      }

      node.style.transitionDuration = `${duration}ms`

      animate(node, {
        opacity: [0.35, targetOpacity],
        strokeWidth: [1.5, 2.5, 2],
        duration,
        ease: VISUALIZATION_EASE,
      })
    }
  }, [output, reducedMotion, showAllZones, topZoneIds, visibleZoneIds])

  return (
    <section className="space-y-3" data-testid="risk-line-chart">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">Zone Risk by Phase</h3>
        <TopZonesToggle
          showAllZones={showAllZones}
          onShowAllZonesChange={setShowAllZones}
          topCount={Math.min(TOP_ZONE_COUNT, allZoneIds.length)}
          totalCount={allZoneIds.length}
        />
      </div>

      <svg
        width={CHART_SIZE.width}
        height={CHART_SIZE.height}
        viewBox={`0 0 ${CHART_SIZE.width} ${CHART_SIZE.height}`}
        role="img"
        aria-label="Zone risk line chart"
        data-testid="risk-line-svg"
        data-transition-ms={VISUALIZATION_TRANSITION_MS}
        data-reduced-motion={String(reducedMotion)}
        data-y-domain="0,1"
      >
        <line
          x1={CHART_SIZE.marginLeft}
          y1={CHART_SIZE.height - CHART_SIZE.marginBottom}
          x2={CHART_SIZE.width - CHART_SIZE.marginRight}
          y2={CHART_SIZE.height - CHART_SIZE.marginBottom}
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        <line
          x1={CHART_SIZE.marginLeft}
          y1={CHART_SIZE.marginTop}
          x2={CHART_SIZE.marginLeft}
          y2={CHART_SIZE.height - CHART_SIZE.marginBottom}
          stroke="#cbd5e1"
          strokeWidth={1}
        />

        {model.phaseOrder.map((phaseId) => (
          <text
            key={phaseId}
            x={xScale(phaseId) ?? CHART_SIZE.marginLeft}
            y={CHART_SIZE.height - CHART_SIZE.marginBottom + 18}
            textAnchor="middle"
            fill="#475569"
            fontSize="12"
          >
            {phaseId}
          </text>
        ))}

        {[0, 0.5, 1].map((tick) => (
          <text
            key={`y-${tick}`}
            x={CHART_SIZE.marginLeft - 8}
            y={yScale(tick) + 4}
            textAnchor="end"
            fill="#64748b"
            fontSize="11"
          >
            {tick.toFixed(2)}
          </text>
        ))}

        {visibleZoneIds.map((zoneId) => {
          const series = model.zoneSeries[zoneId]
          if (!series) {
            return null
          }

          const latestBand = model.latestZoneRisk[zoneId]?.riskBand ?? "green"
          const path = lineBuilder(series.points)
          if (!path) {
            return null
          }

          return (
            <path
              key={zoneId}
              d={path}
              fill="none"
              stroke={colorForBand(latestBand)}
              strokeWidth={2}
              opacity={1}
              data-testid={`risk-line-${zoneId}`}
              data-chart-path="true"
              data-zone-id={zoneId}
              ref={(node) => {
                if (node) {
                  pathRefs.current.set(zoneId, node)
                } else {
                  pathRefs.current.delete(zoneId)
                }
              }}
              id={`risk-line-${zoneId}`}
            />
          )
        })}
      </svg>
    </section>
  )
}