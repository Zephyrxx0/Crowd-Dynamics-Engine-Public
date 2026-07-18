import { z } from "zod"
import { create } from "zustand"
import { persist } from "zustand/middleware"

import {
  ComparisonPairSchema,
  PersistedRunSchema,
  type PersistedRun,
} from "@/comparison/contracts/comparison.schema"
import { makeValidatedStorage } from "@/lib/storage/makeValidatedStorage"
import type { SimulationOutput } from "@/simulation/contracts/output.schema"

const STORE_KEY = "comparison-store"

const PersistedComparisonStateSchema = z.strictObject({
  runHistory: z.array(PersistedRunSchema),
  baselineRunId: z.string().nullable(),
  candidateRunId: z.string().nullable(),
})

type PersistedComparisonState = z.infer<typeof PersistedComparisonStateSchema>

type ComparisonStoreState = PersistedComparisonState & {
  appendRun: (output: SimulationOutput, scenarioLabel?: string) => void
  selectBaselineRun: (runId: string | null) => void
  selectCandidateRun: (runId: string | null) => void
  removeRun: (runId: string) => void
  reset: () => void
}

const defaultState: PersistedComparisonState = {
  runHistory: [],
  baselineRunId: null,
  candidateRunId: null,
}

function getRunById(runHistory: PersistedRun[], runId: string | null) {
  if (!runId) {
    return null
  }
  return runHistory.find((run) => run.id === runId) ?? null
}

function selectDefaultPair(runHistory: PersistedRun[]) {
  const candidate = runHistory[runHistory.length - 1] ?? null
  const baseline = runHistory.length > 1 ? runHistory[runHistory.length - 2] ?? null : null

  return {
    baselineRunId: baseline?.id ?? null,
    candidateRunId: candidate?.id ?? null,
  }
}

export const useComparisonStore = create<ComparisonStoreState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      appendRun: (output, scenarioLabel) => {
        const timestamp = new Date().toISOString()
        const label = scenarioLabel?.trim() || "Current Scenario"
        const run: PersistedRun = PersistedRunSchema.parse({
          id: `${timestamp}:${output.runDeterministicHash}`,
          createdAt: timestamp,
          runDeterministicHash: output.runDeterministicHash,
          scenarioLabel: label,
          output,
        })

        set((state) => {
          const nextHistory = [...state.runHistory, run]
          const defaults = selectDefaultPair(nextHistory)

          return {
            runHistory: nextHistory,
            baselineRunId: state.baselineRunId ?? defaults.baselineRunId,
            candidateRunId: run.id,
          }
        })
      },
      selectBaselineRun: (runId) => {
        set((state) => {
          if (runId && !getRunById(state.runHistory, runId)) {
            return state
          }

          const nextCandidateRunId = runId && state.candidateRunId === runId ? null : state.candidateRunId
          const pair = runId && nextCandidateRunId ? { baselineRunId: runId, candidateRunId: nextCandidateRunId } : null
          if (pair) {
            const parsed = ComparisonPairSchema.safeParse(pair)
            if (!parsed.success) {
              return state
            }
          }

          return { baselineRunId: runId, candidateRunId: nextCandidateRunId }
        })
      },
      selectCandidateRun: (runId) => {
        set((state) => {
          if (runId && !getRunById(state.runHistory, runId)) {
            return state
          }

          const nextBaselineRunId = runId && state.baselineRunId === runId ? null : state.baselineRunId
          const pair = nextBaselineRunId && runId ? { baselineRunId: nextBaselineRunId, candidateRunId: runId } : null
          if (pair) {
            const parsed = ComparisonPairSchema.safeParse(pair)
            if (!parsed.success) {
              return state
            }
          }

          return { baselineRunId: nextBaselineRunId, candidateRunId: runId }
        })
      },
      removeRun: (runId) => {
        set((state) => {
          const nextHistory = state.runHistory.filter((run) => run.id !== runId)
          const defaults = selectDefaultPair(nextHistory)

          return {
            runHistory: nextHistory,
            baselineRunId: state.baselineRunId === runId ? defaults.baselineRunId : state.baselineRunId,
            candidateRunId: state.candidateRunId === runId ? defaults.candidateRunId : state.candidateRunId,
          }
        })
      },
      reset: () => set({ ...defaultState }),
    }),
    {
      name: STORE_KEY,
      storage: makeValidatedStorage((raw) => {
        const result = PersistedComparisonStateSchema.safeParse(raw)
        return result.success ? result.data : null
      }),
      partialize: (state) => ({
        runHistory: state.runHistory,
        baselineRunId: state.baselineRunId,
        candidateRunId: state.candidateRunId,
      }),
    },
  ),
)
