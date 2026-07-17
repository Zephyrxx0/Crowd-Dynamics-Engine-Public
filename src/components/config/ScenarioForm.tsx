"use client";

import { zodResolver } from "@hookform/resolvers/zod"
import { memo, useEffect, useMemo, useState } from "react"
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StadiumSim } from "@/simulation/adapters/StadiumSim"
import {
  SimulationInputSchema,
  type SimulationInput,
} from "@/simulation/contracts/input.schema"
import { useScenarioStore } from "@/hooks/useScenarioStore"
import { ValidationList } from "./ValidationList"

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
  const [validationErrors, setValidationErrors] = useState<string[]>([])

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
        <div key={field.id} className="flex gap-3 py-3 first:pt-0" data-testid="zones-row">
          <ScenarioRow label="Zone ID" className="flex-1">
            <Input className="bg-background border-border h-9" {...form.register(`zones.${index}.id` as const)} />
          </ScenarioRow>
          <ScenarioRow label="Capacity" className="flex-1">
            <Input
              type="number"
              className="bg-background border-border h-9"
              {...form.register(`zones.${index}.capacity` as const, { valueAsNumber: true })}
            />
          </ScenarioRow>
        </div>
      )),
    [zones.fields, form],
  )

  return (
    <form className="flex flex-col gap-5" onSubmit={(event) => event.preventDefault()} data-testid="scenario-form">
      <Tabs defaultValue="zones" className="w-full">
        <TabsList className="w-full grid grid-cols-4 gap-0.5 bg-muted p-0.5 h-auto rounded-md">
          <TabsTrigger value="zones" className="text-xs font-semibold data-active:bg-background data-active:shadow-none rounded">Zones</TabsTrigger>
          <TabsTrigger value="gates" className="text-xs font-semibold data-active:bg-background data-active:shadow-none rounded">Gates</TabsTrigger>
          <TabsTrigger value="phases" className="text-xs font-semibold data-active:bg-background data-active:shadow-none rounded">Phases</TabsTrigger>
          <TabsTrigger value="arrivals" className="text-xs font-semibold data-active:bg-background data-active:shadow-none rounded">Arrivals</TabsTrigger>
        </TabsList>

        <Accordion className="mt-4" data-testid="calibration-accordion">
          <AccordionItem value="advanced-calibration" className="border-border rounded-md border px-3">
            <AccordionTrigger className="text-xs font-bold uppercase tracking-widest text-primary/70 hover:no-underline hover:text-primary py-2.5" data-testid="advanced-calibration-trigger">Advanced Calibration</AccordionTrigger>
            <AccordionContent>
              <div className="pb-3" data-testid="advanced-calibration-content">
                {mode === "detailed" ? (
                  <ScenarioRow label="Sub-zones per zone">
                    <Input
                      type="number"
                      className="bg-background border-border h-9"
                      {...form.register("detailed.subZonesPerZone", { valueAsNumber: true })}
                    />
                  </ScenarioRow>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Switch mode to <strong className="text-foreground">Detailed</strong> to edit sub-zone calibration.
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-5 space-y-4">
          <div className="flex gap-3">
            <ScenarioRow label="Schema Version" className="flex-1">
              <Input className="bg-background border-border font-mono text-xs h-9" {...form.register("schemaVersion")} />
            </ScenarioRow>
            <ScenarioRow label="Mode" className="flex-1">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register("mode")}
              >
                <option value="zone">Zone</option>
                <option value="detailed">Detailed</option>
              </select>
            </ScenarioRow>
          </div>

          <TabsContent value="zones" className="mt-0">
            <div className="divide-y divide-border/40 rounded-md border border-border/50 bg-card p-3">
              <div className="flex items-center gap-3 pb-2.5 mb-2 border-b border-border/30">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Zone Definitions</span>
                <span className="text-[10px] text-muted-foreground">— {zones.fields.length} configured</span>
              </div>
              {zoneRows}
            </div>
          </TabsContent>

          <TabsContent value="gates" className="mt-0">
            <div className="divide-y divide-border/40 rounded-md border border-border/50 bg-card p-3">
              <div className="flex items-center gap-3 pb-2.5 mb-2 border-b border-border/30">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Gate Configurations</span>
                <span className="text-[10px] text-muted-foreground">— {gates.fields.length} configured</span>
              </div>
              {gates.fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-2 gap-x-3 gap-y-2 py-3 first:pt-0">
                  <ScenarioRow label="Gate ID">
                    <Input className="bg-background border-border h-9" {...form.register(`gates.${index}.id` as const)} />
                  </ScenarioRow>
                  <ScenarioRow label="Zone">
                    <Input className="bg-background border-border h-9" {...form.register(`gates.${index}.zoneId` as const)} />
                  </ScenarioRow>
                  <ScenarioRow label="Throughput/min">
                    <Input
                      type="number"
                      className="bg-background border-border h-9"
                      {...form.register(`gates.${index}.throughputPerMin` as const, { valueAsNumber: true })}
                    />
                  </ScenarioRow>
                  <ScenarioRow label="Delay (min)">
                    <Input
                      type="number"
                      className="bg-background border-border h-9"
                      {...form.register(`gates.${index}.delayMin` as const, { valueAsNumber: true })}
                    />
                  </ScenarioRow>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="phases" className="mt-0">
            <div className="divide-y divide-border/40 rounded-md border border-border/50 bg-card p-3">
              <div className="flex items-center gap-3 pb-2.5 mb-2 border-b border-border/30">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Phase Schedule</span>
                <span className="text-[10px] text-muted-foreground">— {phases.fields.length} configured</span>
              </div>
              {phases.fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 py-3 first:pt-0">
                  <ScenarioRow label="Phase ID" className="flex-1">
                    <Input className="bg-background border-border h-9" {...form.register(`phases.${index}.id` as const)} />
                  </ScenarioRow>
                  <ScenarioRow label="Order" className="w-20">
                    <Input
                      type="number"
                      className="bg-background border-border h-9"
                      {...form.register(`phases.${index}.order` as const, { valueAsNumber: true })}
                    />
                  </ScenarioRow>
                  <ScenarioRow label="Duration (min)" className="flex-1">
                    <Input
                      type="number"
                      className="bg-background border-border h-9"
                      {...form.register(`phases.${index}.durationMin` as const, { valueAsNumber: true })}
                    />
                  </ScenarioRow>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="arrivals" className="mt-0">
            <div className="divide-y divide-border/40 rounded-md border border-border/50 bg-card p-3">
              <div className="flex items-center gap-3 pb-2.5 mb-2 border-b border-border/30">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Arrival Patterns</span>
                <span className="text-[10px] text-muted-foreground">— {arrivals.fields.length} configured</span>
              </div>
              {arrivals.fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 py-3 first:pt-0">
                  <ScenarioRow label="Phase" className="flex-1">
                    <Input className="bg-background border-border h-9" {...form.register(`arrivals.${index}.phaseId` as const)} />
                  </ScenarioRow>
                  <ScenarioRow label="Zone" className="flex-1">
                    <Input className="bg-background border-border h-9" {...form.register(`arrivals.${index}.zoneId` as const)} />
                  </ScenarioRow>
                  <ScenarioRow label="Demand Fans" className="flex-1">
                    <Input
                      type="number"
                      className="bg-background border-border h-9"
                      {...form.register(`arrivals.${index}.demandFans` as const, { valueAsNumber: true })}
                    />
                  </ScenarioRow>
                </div>
              ))}
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <ValidationList errors={validationErrors} />

      <Button 
        type="button" 
        data-testid="run-button" 
        onClick={form.handleSubmit(onValidInput, onInvalidInput)}
        className="w-full bg-primary text-primary-foreground font-bold tracking-widest uppercase hover:bg-primary/90 transition-all h-11"
      >
        Run Simulation
      </Button>
    </form>
  )
}
