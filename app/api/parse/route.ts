// app/api/parse/route.ts
import { NextResponse } from "next/server";
import * as pdfParseModule from "pdf-parse";
import mammoth from "mammoth";

/**
 * Normalize pdf-parse import shape for ESM/CJS interop.
 */
const pdfParse = (pdfParseModule as any).default ?? (pdfParseModule as any);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "no file provided" }, { status: 400 });
    }

    const filename = String(file.name || "upload").toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (filename.endsWith(".pdf")) {
      if (!pdfParse) {
        throw new Error("pdf-parse module not available");
      }
      const data = await pdfParse(buffer);
      text = String(data.text || "").trim();
    } else if (filename.endsWith(".docx") || filename.endsWith(".doc")) {
      const r = await mammoth.extractRawText({ buffer });
      text = String(r.value || "").trim();
    } else {
      text = buffer.toString("utf-8").trim();
    }

    text = text.replace(/\r\n/g, "\n").replace(/\n{2,}/g, "\n\n");

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("parse error:", err);
    return NextResponse.json({ error: "parse_failed", detail: String(err) }, { status: 500 });
  }
}
