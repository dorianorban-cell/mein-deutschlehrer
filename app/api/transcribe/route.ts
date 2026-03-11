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

  return NextResponse.json({ transcript: transcription.text });
}
