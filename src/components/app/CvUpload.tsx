import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileUp, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { parseCv, type ParsedCv } from "@/lib/cv.functions";

function toBase64(buf: ArrayBuffer) {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const NAME_KEY = "lp_cv_name";

export function CvUpload({ knownSkills, knownUniversities, onParsed }: { knownSkills: string[]; knownUniversities: string[]; onParsed: (cv: ParsedCv) => void }) {
  const { user } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [stage, setStage] = useState("");
  const [usedFile, setUsedFile] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("student_profiles").select("cv_path").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data?.cv_path) { setUsedFile(localStorage.getItem(NAME_KEY) || data.cv_path.split("/").pop() || "CV"); setConsent(true); }
    });
  }, [user]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const handle = async (file: File): Promise<void> => {
    if (!user) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isDocx = file.name.toLowerCase().endsWith(".docx");
    if (!isPdf && !isDocx) { toast.error("Please upload a PDF or Word (.docx) file."); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("The file is larger than 10 MB."); return; }
    setBusy(true); setPct(5); setStage("Opening your file…");
    try {
      const buf = await file.arrayBuffer();
      let text: string | null = null;
      if (isDocx) {
        const mammoth = await import("mammoth");
        text = (await mammoth.extractRawText({ arrayBuffer: buf })).value.trim();
        if (!text) throw new Error("This document looks empty.");
      }
      setPct(15); setStage("Uploading securely…");
      const path = `${user.id}/cv.${isPdf ? "pdf" : "docx"}`;
      const up = await supabase.storage.from("cvs").upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (up.error) throw up.error;
      await supabase.from("student_profiles").upsert({ user_id: user.id, cv_path: path, cv_consent_at: new Date().toISOString() });
      setPct(30); setStage("Reading your education, skills and experience…");
      // AI step has no real progress signal: ease towards 95%.
      timer.current = setInterval(() => setPct((p) => (p < 95 ? p + Math.max(0.5, (95 - p) / 25) : p)), 300);
      const res = await parseCv({ data: { fileName: file.name, pdfBase64: isPdf ? toBase64(buf) : null, text: text ? text.slice(0, 60000) : null, knownSkills, knownUniversities } });
      if (timer.current) clearInterval(timer.current);
      if (!res.ok) throw new Error(res.error);
      setPct(100); setStage("Done!");
      onParsed(res.cv);
      localStorage.setItem(NAME_KEY, file.name);
      setUsedFile(file.name);
      toast.success("CV read! Check the details and edit anything that's off.");
    } catch (e) {
      if (timer.current) clearInterval(timer.current);
      toast.error((e as Error).message || "Something went wrong reading your CV.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const fileInput = <input ref={input} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />;
  const progress = busy && (
    <div className="mt-3 space-y-1.5">
      <div className="flex justify-between text-sm"><span className="text-muted-foreground">{stage}</span><span className="font-semibold tabular-nums">{Math.round(pct)}%</span></div>
      <Progress value={pct} />
    </div>
  );

  if (usedFile && !busy) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary-soft/60 p-4">
        <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-primary" />CV used: <span className="truncate font-normal">{usedFile}</span></p>
        <p className="mt-1 text-sm text-muted-foreground">Your details were filled in from this CV. Review them below, or upload a different file to read it again.</p>
        {fileInput}
        <Button variant="outline" size="sm" className="mt-3" onClick={() => input.current?.click()}><RefreshCw className="size-4" />Change file</Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary-soft/60 p-4">
      <p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-primary" />Fill in automatically from your CV</p>
      <p className="mt-1 text-sm text-muted-foreground">Upload a PDF or Word file. We'll pre-fill education, skills and experience for you to review.</p>
      <label className="mt-3 flex items-start gap-2 text-sm">
        <Checkbox checked={consent} onCheckedChange={(c) => setConsent(!!c)} className="mt-0.5" />
        <span>I agree that LaunchPad stores my CV and reads it with AI to fill in my profile. I can delete it any time.</span>
      </label>
      {fileInput}
      {progress || (
        <Button className="mt-3" disabled={!consent} onClick={() => input.current?.click()}><FileUp className="size-4" />Upload CV</Button>
      )}
    </div>
  );
}
