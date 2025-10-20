"use client";
import React, { useState } from "react";
import Dropzone from "@/components/Dropzone"

export default function Page() {
  const [resumeText, setResumeText] = useState<string>("")
  const [loading, setLoading] = useState(false);

  async function handleParse(file: File) {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file, file.name);
      const res = await fetch("/api/parse", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.detail || json?.error || "parse failed");
      }
      setResumeText(json.text || "");
    } catch (e: any) {
      alert("parse failed: " + e.message)
    } finally {
      setLoading(false);
    }
  }

  return(
    <main className="max-w-4xl mx-auto p-32">
      <h1 className="text-2xl font-semibold mb-4">ResumeAI</h1>

      <section className="mb-6">
        <Dropzone onFile={handleParse} />
      </section>

      <section>
        <label className="block text-sm font-medium mb-4">Parsed text</label>
        <textarea value={resumeText} readOnly className="w-full h-72 p-2 border rounded-4xl"/>
      </section>

      {loading && <p className="mt-2 text-sm">Parsing file...</p>}
    </main>
  )
}