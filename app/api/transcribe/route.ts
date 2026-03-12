import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const formData = await request.formData();
  const audioFile = formData.get("audio") as File | null;

  if (!audioFile) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  const transcription = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file: audioFile,
    language: "de",
  });

  const text = transcription.text.trim();

  // Filter Whisper hallucinations that occur on silence/near-silence input
  const HALLUCINATIONS = [
    "untertitel",
    "amara.org",
    "thank you for watching",
    "thanks for watching",
    "subscribe",
    "vielen dank",
    "tschüss",
    "auf wiedersehen",
  ];
  const lower = text.toLowerCase();
  const isHallucination =
    text.length < 3 ||
    HALLUCINATIONS.some((h) => lower.includes(h));

  if (isHallucination) {
    return NextResponse.json({ transcript: "" });
  }

  return NextResponse.json({ transcript: text });
}
