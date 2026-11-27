import { useState } from "react";
import { Button } from "@/components/ui/button";
export function SampleUploads({
  onCv,
  onLadok,
}: {
  onCv: () => string[];
  onLadok: () => string[];
}) {
  const [message, setMessage] = useState("");
  function report(items: string[]) {
    setMessage(items.length ? "Added: " + items.join(", ") : "Already imported.");
  }
  return (
    <section className="space-y-3">
      <p>Use a sample CV and Ladok transcript to populate your skills and completed courses.</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => report(onCv())}>
          Upload CV
        </Button>
        <Button type="button" variant="outline" onClick={() => report(onLadok())}>
          Upload Ladok transcript
        </Button>
      </div>
      <p role="status">{message}</p>
    </section>
  );
}
