"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { memo, useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form"
import { Play, Plus, X, FileText } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StadiumSim } from "@/simulation/adapters/StadiumSim"
import {
  SimulationInputSchema,
  type SimulationInput,
} from "@/simulation/contracts/input.schema"
import { useScenarioStore } from "@/hooks/useScenarioStore"
import { useRiskReportStore } from "@/hooks/useRiskReportStore"
import { ValidationList } from "./ValidationList"
import { cn } from "@/lib/utils"

type ScenarioRowProps = {
  label: string
  children: React.ReactNode
  className?: string
}

const ScenarioRow = memo(function ScenarioRow({ label, children, className }: ScenarioRowProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      {children}
    </label>
  )
})

type ArrayFieldCardProps = {
  label: string
  count: number
  onAdd: () => void
  onRemove: (index: number) => void
  children: React.ReactNode
  emptyMessage?: string
}

function ArrayFieldCard({ label, count, onAdd, onRemove, children, emptyMessage }: ArrayFieldCardProps) {
  return (
    <div className="rounded-xl bg-card p-3 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border/30">
        <span className="text-xs font-semibold text-foreground/80">
          {label}
          <span className="ml-1.5 text-muted-foreground font-normal">({count})</span>
        </span>
        <Button variant="outline" size="xs" onClick={onAdd}>
          <Plus className="size-3" />
          Add
        </Button>
      </div>
      {count === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-xs text-muted-foreground">{emptyMessage ?? `No ${label.toLowerCase()} configured`}</p>
          <Button variant="ghost" size="sm" onClick={onAdd}>
            <Plus className="size-3 mr-1" /> Add {label.slice(0, -1).toLowerCase()}
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {children}
        </div>
      )}
    </div>
  )
}

function collectErrorMessages(errors: FieldErrors<SimulationInput>, prefix = ""): string[] {
  const messages: string[] = []

  for (const [key, value] of Object.entries(errors)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key

    if (!value) {
      continue
    }

    if (typeof value === "object" && "message" in value && value.message) {
      messages.push(`${nextPrefix}: ${String(value.message)}`)
      continue
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === "object") {
          messages.push(...collectErrorMessages(item as FieldErrors<SimulationInput>, `${nextPrefix}[${index}]`))
        }
      })
      continue
    }

    if (typeof value === "object") {
      messages.push(...collectErrorMessages(value as FieldErrors<SimulationInput>, nextPrefix))
    }
  }

  return messages
}

export function ScenarioForm() {
  const currentInput = useScenarioStore((state) => state.currentInput)
  const updateInput = useScenarioStore((state) => state.updateInput)
  const setLatestSimulationOutput = useScenarioStore((state) => state.setLatestSimulationOutput)
  const latestOutput = useScenarioStore((state) => state.latestSimulationOutput)
  const [activeTab, setActiveTab] = useState("zones")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const router = useRouter()

  const form = useForm<SimulationInput>({
    resolver: zodResolver(SimulationInputSchema),
    defaultValues: currentInput,
  })

  const zones = useFieldArray({ control: form.control, name: "zones" })
  const gates = useFieldArray({ control: form.control, name: "gates" })
  const phases = useFieldArray({ control: form.control, name: "phases" })
  const arrivals = useFieldArray({ control: form.control, name: "arrivals" })
  const mode = form.watch("mode")

  useEffect(() => {
    form.reset(currentInput)
  }, [currentInput, form])

  const onValidInput = (input: SimulationInput) => {
    setValidationErrors([])
    updateInput(input)
    const result = StadiumSim.run(input)
    setLatestSimulationOutput(result)
  }

  const onInvalidInput = (errors: FieldErrors<SimulationInput>) => {
    const flattened = collectErrorMessages(errors)
    setValidationErrors(flattened.length > 0 ? flattened : ["Invalid scenario input"])
  }

  const zoneRows = useMemo(
    () =>
      zones.fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-3 py-2.5 items-end" data-testid="zones-row">
          <ScenarioRow label="Zone ID">
            <Input className="bg-background min-h-10" {...form.register(`zones.${index}.id` as const)} />
          </ScenarioRow>
          <ScenarioRow label="Capacity">
            <Input
              type="number"
              className="bg-background min-h-10"
              {...form.register(`zones.${index}.capacity` as const, { valueAsNumber: true })}
            />
          </ScenarioRow>
          <Button variant="ghost" size="icon-xs" onClick={() => zones.remove(index)} className="text-muted-foreground hover:text-destructive mb-0.5 transition-[color,transform] duration-150 ease-out active:scale-[0.96]">
            <X className="size-3.5" />
          </Button>
        </div>
      )),
    [zones.fields, form],
  )

  const gateRows = useMemo(
    () =>
      gates.fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-x-3 gap-y-1.5 py-2.5 items-end" data-testid="gates-row">
          <ScenarioRow label="Gate ID">
            <Input className="bg-background min-h-10" {...form.register(`gates.${index}.id` as const)} />
          </ScenarioRow>
          <ScenarioRow label="Zone">
            <Input className="bg-background min-h-10" {...form.register(`gates.${index}.zoneId` as const)} />
          </ScenarioRow>
          <Button variant="ghost" size="icon-xs" onClick={() => gates.remove(index)} className="text-muted-foreground hover:text-destructive mb-0.5 row-span-2 self-center transition-[color,transform] duration-150 ease-out active:scale-[0.96]">
            <X className="size-3.5" />
          </Button>
          <ScenarioRow label="Throughput/min">
            <Input
              type="number"
              className="bg-background min-h-10"
              {...form.register(`gates.${index}.throughputPerMin` as const, { valueAsNumber: true })}
            />
          </ScenarioRow>
          <ScenarioRow label="Delay (min)">
            <Input
              type="number"
              className="bg-background min-h-10"
              {...form.register(`gates.${index}.delayMin` as const, { valueAsNumber: true })}
            />
          </ScenarioRow>
        </div>
      )),
    [gates.fields, form],
  )

  const phaseRows = useMemo(
    () =>
      phases.fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 py-2.5 items-end" data-testid="phases-row">
          <ScenarioRow label="Phase ID" className="flex-1">
            <Input className="bg-background min-h-10" {...form.register(`phases.${index}.id` as const)} />
          </ScenarioRow>
          <ScenarioRow label="Order">
            <Input
              type="number"
              className="bg-background min-h-10 w-20"
              {...form.register(`phases.${index}.order` as const, { valueAsNumber: true })}
            />
          </ScenarioRow>
          <ScenarioRow label="Duration (min)">
            <Input
              type="number"
              className="bg-background min-h-10"
              {...form.register(`phases.${index}.durationMin` as const, { valueAsNumber: true })}
            />
          </ScenarioRow>
          <Button variant="ghost" size="icon-xs" onClick={() => phases.remove(index)} className="text-muted-foreground hover:text-destructive mb-0.5 transition-[color,transform] duration-150 ease-out active:scale-[0.96]">
            <X className="size-3.5" />
          </Button>
        </div>
      )),
    [phases.fields, form],
  )

  const arrivalRows = useMemo(
    () =>
      arrivals.fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 py-2.5 items-end" data-testid="arrivals-row">
          <ScenarioRow label="Phase" className="flex-1">
            <Input className="bg-background min-h-10" {...form.register(`arrivals.${index}.phaseId` as const)} />
          </ScenarioRow>
          <ScenarioRow label="Zone" className="flex-1">
            <Input className="bg-background min-h-10" {...form.register(`arrivals.${index}.zoneId` as const)} />
          </ScenarioRow>
          <ScenarioRow label="Demand">
            <Input
              type="number"
              className="bg-background min-h-10"
              {...form.register(`arrivals.${index}.demandFans` as const, { valueAsNumber: true })}
            />
          </ScenarioRow>
          <Button variant="ghost" size="icon-xs" onClick={() => arrivals.remove(index)} className="text-muted-foreground hover:text-destructive mb-0.5 transition-[color,transform] duration-150 ease-out active:scale-[0.96]">
            <X className="size-3.5" />
          </Button>
        </div>
      )),
    [arrivals.fields, form],
  )

  return (
    <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()} data-testid="scenario-form">
      <div className="flex gap-1 stagger-enter [animation-delay:100ms]">
        {(["zones", "gates", "phases", "arrivals"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition-[color,background-color,transform] duration-150 ease-out active:scale-[0.96] will-change-transform",
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <Accordion className="stagger-enter [animation-delay:150ms]" data-testid="calibration-accordion">
        <AccordionItem value="advanced" className="rounded-md px-3 ring-1 ring-foreground/10 transition-shadow duration-200 hover:ring-foreground/20">
          <AccordionTrigger className="min-h-10 text-xs font-semibold text-muted-foreground hover:text-foreground py-3 transition-[color,transform] duration-200 ease-out will-change-transform" data-testid="advanced-calibration-trigger">Advanced</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-3" data-testid="advanced-calibration-content">
              <ScenarioRow label="Schema Version">
                <Input className="bg-background font-mono text-xs min-h-10" {...form.register("schemaVersion")} />
              </ScenarioRow>
              <ScenarioRow label="Mode">
                <select
                  className="flex min-h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-[border-color,box-shadow] duration-150 ease-out ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("mode")}
                >
                  <option value="zone">Zone</option>
                  <option value="detailed">Detailed</option>
                </select>
              </ScenarioRow>
              {mode === "detailed" && (
                <ScenarioRow label="Sub-zones per zone">
                  <Input
                    type="number"
                    className="bg-background min-h-10"
                    {...form.register("detailed.subZonesPerZone", { valueAsNumber: true })}
                  />
                </ScenarioRow>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="space-y-4 stagger-enter [animation-delay:200ms]">
        {activeTab === "zones" && (
          <ArrayFieldCard
            label="Zone Definitions"
            count={zones.fields.length}
            onAdd={() => zones.append({ id: "", capacity: 0 })}
            onRemove={(i) => zones.remove(i)}
            emptyMessage="No zones configured"
          >
            {zoneRows}
          </ArrayFieldCard>
        )}

        {activeTab === "gates" && (
          <ArrayFieldCard
            label="Gate Configurations"
            count={gates.fields.length}
            onAdd={() => gates.append({ id: "", zoneId: "", throughputPerMin: 0, delayMin: 0 })}
            onRemove={(i) => gates.remove(i)}
            emptyMessage="No gates configured"
          >
            {gateRows}
          </ArrayFieldCard>
        )}

        {activeTab === "phases" && (
          <ArrayFieldCard
            label="Phase Schedule"
            count={phases.fields.length}
            onAdd={() => phases.append({ id: "", order: 0, durationMin: 0 })}
            onRemove={(i) => phases.remove(i)}
            emptyMessage="No phases configured"
          >
            {phaseRows}
          </ArrayFieldCard>
        )}

        {activeTab === "arrivals" && (
          <ArrayFieldCard
            label="Arrival Patterns"
            count={arrivals.fields.length}
            onAdd={() => arrivals.append({ phaseId: "", zoneId: "", demandFans: 0 })}
            onRemove={(i) => arrivals.remove(i)}
            emptyMessage="No arrivals configured"
          >
            {arrivalRows}
          </ArrayFieldCard>
        )}
      </div>

      <ValidationList errors={validationErrors} />

      <div className="flex gap-3 stagger-enter [animation-delay:400ms]">
        <Button
          type="button"
          data-testid="run-button"
          onClick={form.handleSubmit(onValidInput, onInvalidInput)}
          className="flex-1 h-10 text-sm font-bold tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md active:scale-[0.96] will-change-transform transition-[background-color,transform,box-shadow,opacity] duration-150 ease-out"
        >
          <Play className="size-4 fill-current" />
          Run Simulation
        </Button>

        {latestOutput && (
          <Button
            type="button"
            data-testid="generate-report-button"
            onClick={() => {
              void useRiskReportStore.getState().generateFromSimulation(latestOutput)
              router.push("/report")
            }}
            className="flex-1 h-10 text-sm font-bold tracking-wider gap-2 bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md active:scale-[0.96] will-change-transform transition-[background-color,transform,box-shadow,opacity] duration-150 ease-out"
          >
            <FileText className="size-4" />
            Generate Report
          </Button>
        )}
      </div>
    </form>
  )
}
