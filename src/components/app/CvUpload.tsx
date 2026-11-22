import { useRef, useState } from "react";
import { FileUp, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { parseCv, type ParsedCv } from "@/lib/cv.functions";

function toBase64(buf: ArrayBuffer) {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function CvUpload({ knownSkills, knownUniversities, onParsed }: { knownSkills: string[]; knownUniversities: string[]; onParsed: (cv: ParsedCv) => void }) {
  const { user } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = async (file: File): Promise<void> => {
    if (!user) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isDocx = file.name.toLowerCase().endsWith(".docx");
    if (!isPdf && !isDocx) { toast.error("Please upload a PDF or Word (.docx) file."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("The file is larger than 10 MB."); return; }
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      let text: string | null = null;
      if (isDocx) {
        const mammoth = await import("mammoth");
        text = (await mammoth.extractRawText({ arrayBuffer: buf })).value.trim();
        if (!text) throw new Error("This document looks empty.");
      }
      const path = `${user.id}/cv.${isPdf ? "pdf" : "docx"}`;
      const up = await supabase.storage.from("cvs").upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (up.error) throw up.error;
      await supabase.from("student_profiles").upsert({ user_id: user.id, cv_path: path, cv_consent_at: new Date().toISOString() });
      const res = await parseCv({ data: { fileName: file.name, pdfBase64: isPdf ? toBase64(buf) : null, text: text ? text.slice(0, 60000) : null, knownSkills, knownUniversities } });
      if (!res.ok) throw new Error(res.error);
      onParsed(res.cv);
      toast.success("CV read! Check the details and edit anything that's off.");
    } catch (e) {
      toast.error((e as Error).message || "Something went wrong reading your CV.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary-soft/60 p-4">
      <p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" />Fill in automatically from your CV</p>
      <p className="mt-1 text-sm text-muted-foreground">Upload a PDF or Word file. We'll pre-fill education, skills and experience for you to review.</p>
      <label className="mt-3 flex items-start gap-2 text-sm">
        <Checkbox checked={consent} onCheckedChange={(c) => setConsent(!!c)} className="mt-0.5" />
        <span>I agree that LaunchPad stores my CV and reads it with AI to fill in my profile. I can delete it any time.</span>
      </label>
      <input ref={input} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
      <Button className="mt-3" disabled={!consent || busy} onClick={() => input.current?.click()}>
        {busy ? <><Loader2 className="size-4 animate-spin" />Reading your CV…</> : <><FileUp className="size-4" />Upload CV</>}
      </Button>
    </div>
  );
}
