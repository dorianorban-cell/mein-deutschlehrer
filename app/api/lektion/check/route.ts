import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ExerciseType } from "@/lib/lesson-types";

interface CheckRequest {
  exerciseType: ExerciseType;
  userAnswer: string;
  correctAnswer: string;
  prompt: string;
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[.,!?]/g, "");
}

export async function POST(request: Request) {
  const body = (await request.json()) as CheckRequest;
  const { exerciseType, userAnswer, correctAnswer, prompt } = body;

  if (exerciseType === "voice_answer") {
    return NextResponse.json({
      correct: true,
      feedback: "Gut gemacht! Weiter so.",
    });
  }

  if (exerciseType === "fill_blank" || exerciseType === "multiple_choice") {
    const correct = normalize(userAnswer) === normalize(correctAnswer);
    return NextResponse.json({
      correct,
      feedback: correct
        ? "Richtig!"
        : `Nicht ganz. Die richtige Antwort ist: „${correctAnswer}"`,
    });
  }

  // fix_sentence — ask Claude to judge semantic/grammatical equivalence
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `You are a German grammar checker. The exercise prompt was: "${prompt}"
The correct answer is: "${correctAnswer}"
The student wrote: "${userAnswer}"

Is the student's answer grammatically correct and semantically equivalent to the correct answer?
Reply with ONLY valid JSON: {"correct": true/false, "feedback": "one short sentence in German"}`,
      },
    ],
  });

  try {
    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
    const result = JSON.parse(raw.trim());
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ correct: false, feedback: `Richtige Antwort: „${correctAnswer}"` });
  }
}
