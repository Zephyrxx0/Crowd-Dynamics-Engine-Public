"use client";
import { useEffect, useRef, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { ChatInterface } from "./ChatInterface";

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => setOpen(false);
    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) {
        dialog.close();
      }
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("click", handleBackdropClick);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/60 transition-transform active:scale-95"
        aria-label="Open Stadium Assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Chat assistant"
        className="m-0 ml-auto h-dvh max-h-dvh w-[400px] max-w-[100vw] border-l border-border bg-background p-0 text-foreground shadow-xl backdrop:bg-black/50 sm:max-w-[400px]"
      >
        <form method="dialog" className="h-full">
          <div className="absolute right-4 top-4 z-50">
            <button
              type="submit"
              aria-label="Close Stadium Assistant"
              className="rounded-full bg-background/50 p-2 hover:bg-background/80 text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="sr-only">Stadium Assistant</h2>
          <div className="h-full">
            <ChatInterface />
          </div>
        </form>
      </dialog>
    </>
  );
}
