import { create } from "zustand"

import { type RiskReport, buildDeterministicRiskReport } from "@/reporting"
import { type GeminiInvoke, generateRiskReport } from "@/reporting/gemini/generateRiskReport"
import type { SimulationOutput } from "@/simulation/contracts/output.schema"

export type RiskReportStatus = "idle" | "loading" | "success" | "fallback"

type GenerateOptions = {
  force?: boolean
}

type RiskReportState = {
  status: RiskReportStatus
  report: RiskReport | null
  errorMessage: string | null
  lastRunHash: string | null
  lastOutput: SimulationOutput | null
  generator: GeminiInvoke | null
  setGenerator: (generator: GeminiInvoke | null) => void
  generateFromSimulation: (output: SimulationOutput, options?: GenerateOptions) => Promise<void>
  retryReportGeneration: () => Promise<void>
  reset: () => void
}

export const useRiskReportStore = create<RiskReportState>((set, get) => ({
  status: "idle",
  report: null,
  errorMessage: null,
  lastRunHash: null,
  lastOutput: null,
  generator: null,
  setGenerator: (generator) => set({ generator }),
  generateFromSimulation: async (output, options) => {
    const force = options?.force ?? false
    const current = get()

    if (!force && current.lastRunHash === output.runDeterministicHash) {
      return
    }

    set({
      status: "loading",
      errorMessage: null,
      lastRunHash: output.runDeterministicHash,
      lastOutput: output,
    })

    try {
      const report = await generateRiskReport({ output, invokeModel: current.generator ?? undefined })
      set({
        status: report.source === "fallback" ? "fallback" : "success",
        report,
        errorMessage:
          report.source === "fallback"
            ? "AI generation failed; deterministic fallback shown."
            : null,
      })
    } catch (error) {
      const fallbackReport = buildDeterministicRiskReport(output)
      set({
        status: "fallback",
        report: fallbackReport,
        errorMessage: error instanceof Error ? error.message : "Unknown report generation error",
      })
    }
  },
  retryReportGeneration: async () => {
    const output = get().lastOutput
    if (!output) {
      return
    }

    await get().generateFromSimulation(output, { force: true })
  },
  reset: () =>
    set({
      status: "idle",
      report: null,
      errorMessage: null,
      lastRunHash: null,
      lastOutput: null,
    }),
}))
