import { NextResponse } from "next/server"
import { PDFParse } from "pdf-parse"
import mammoth from "mammoth"

export async function POST(req:Request) {
    try {
        const form = await req.formData();
        const file = form.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "no file provided" }, { status:400});
        }

        const filename = String(file.name || "upload");
        const buffer = Buffer.from(await file.arrayBuffer());

        let text = "";

        if (filename.toLowerCase().endsWith(".pdf")) {
            const data = await PDFParse(buffer);
            text = String(data.text || "").trim();
        }
    }
}