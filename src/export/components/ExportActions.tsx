import type { ComparisonViewModel } from "@/comparison/selectors/buildComparisonViewModel"
import type { RiskReport } from "@/reporting"
import { buildBriefingExport } from "@/export/buildBriefingExport"
import { renderBriefingHtml } from "@/export/renderBriefingHtml"

type ExportActionsProps = {
  model: ComparisonViewModel
  report: RiskReport | null
}

function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ExportActions({ model, report }: ExportActionsProps) {
  const briefing = buildBriefingExport(model, report)

  return (
    <div className="flex flex-wrap gap-3" data-testid="export-actions">
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded bg-[#ff3300] hover:bg-[#e62e00] px-4 py-2 text-sm font-bold text-black transition-colors"
        onClick={() => downloadFile(JSON.stringify(briefing, null, 2), "scenario-briefing.json", "application/json")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Export JSON
      </button>
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded bg-[#ff3300] hover:bg-[#e62e00] px-4 py-2 text-sm font-bold text-black transition-colors"
        onClick={() => {
          const html = renderBriefingHtml(briefing)
          const opened = window.open("", "_blank")
          if (!opened) {
            return
          }
          opened.document.write(html)
          opened.document.close()
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
        Open Print Summary
      </button>
    </div>
  )
}
