export default function DeployPage() {
  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto py-6 px-4">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl p-8 text-sm text-foreground/80 shadow-2xl relative overflow-hidden">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-white mb-2">Deploy Simulation</h2>
        <p>
          This flow is deployment-ready for Cloud Run static hosting. Use the deployment runbook to publish the latest build while preserving
          deterministic simulation behavior.
        </p>
      </div>
    </div>
  );
}
