"use client";

const QUICK_QUESTIONS = [
  "Where's my gate?",
  "Best exit after the match?",
  "Where's the nearest concession?",
  "How crowded is my section?",
  "Is there a wheelchair-accessible route?",
  "Where is the accessible drop-off point?",
  "Which gate has the shortest wait time?",
] as const;

interface QuickChipsProps {
  onSelect: (question: string) => void;
}

export function QuickChips({ onSelect }: QuickChipsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {QUICK_QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          className="border border-border bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
