import OpenAI from "openai";

export async function POST(request: Request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { text } = await request.json() as { text: string };

  if (!text?.trim()) {
    return new Response("Missing text", { status: 400 });
  }

  const speech = await openai.audio.speech.create({
    model: "tts-1",
    voice: "onyx",
    input: text,
  });

  const buffer = await speech.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.byteLength.toString(),
    },
  });
}
