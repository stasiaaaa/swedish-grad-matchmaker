import { createContext, useContext, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Ctx = createContext<(title: string) => void>(() => {});
export const useGate = () => useContext(Ctx);

export function GateProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  return (
    <Ctx.Provider value={setTitle}>
      {children}
      <Dialog open={!!title} onOpenChange={(o) => !o && setTitle(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Rocket className="size-6" /></div>
            <DialogTitle className="font-display text-xl">{title}</DialogTitle>
            <DialogDescription>It's free and takes under 3 minutes. Save jobs, get match scores and track your applications.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1" onClick={() => setTitle(null)}><Link to="/auth" search={{ mode: "signup" }}>Create free profile</Link></Button>
            <Button asChild variant="outline" className="flex-1" onClick={() => setTitle(null)}><Link to="/auth" search={{}}>Sign in</Link></Button>
          </div>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
