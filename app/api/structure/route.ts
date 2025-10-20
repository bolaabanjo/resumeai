import { NextResponse } from "next/server";
import { parseSections } from "@/lib/parser";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const text = String(body?.text || "").trim();
        if (!text) {
            return NextResponse.json({ error: "missing text" }, { status: 400});
        }
        const parsed = parseSections(text);
        return NextResponse.json({ parsed });
    } catch (err: any) {
        console.error("structure error:", err);
        return NextResponse.json({ error: "structure_failed", detail: String(err) }, { status: 500});
    }
}