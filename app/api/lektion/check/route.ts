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

// Types that use exact-match checking
const EXACT_MATCH_TYPES: ExerciseType[] = ["fill_blank", "multiple_choice", "cloze_listen"];
// Types that always pass (voice input — graded by engagement not accuracy)
const ALWAYS_PASS_TYPES: ExerciseType[] = ["voice_answer"];
// Types that need semantic / Claude-based checking
const SEMANTIC_CHECK_TYPES: ExerciseType[] = ["fix_sentence", "spaced_replay", "translation", "sentence_mutation"];

export async function POST(request: Request) {
  const body = (await request.json()) as CheckRequest;
  const { exerciseType, userAnswer, correctAnswer, prompt } = body;

  if (ALWAYS_PASS_TYPES.includes(exerciseType)) {
    return NextResponse.json({ correct: true, feedback: "Gut gemacht! Weiter so." });
  }

  if (EXACT_MATCH_TYPES.includes(exerciseType)) {
    const correct = normalize(userAnswer) === normalize(correctAnswer);
    return NextResponse.json({
      correct,
      feedback: correct
        ? "Richtig!"
        : `Nicht ganz. Die richtige Antwort ist: „${correctAnswer}"`,
    });
  }

  if (SEMANTIC_CHECK_TYPES.includes(exerciseType)) {
    const typeHint =
      exerciseType === "translation"
        ? "The student translated an English sentence into German."
        : exerciseType === "spaced_replay"
        ? "The student had to recall and self-correct a past grammar mistake."
        : exerciseType === "sentence_mutation"
        ? "The student had to transform a German sentence as instructed."
        : "The student had to fix a grammatically incorrect German sentence.";

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are a German grammar checker. ${typeHint}
Exercise prompt: "${prompt}"
Expected answer: "${correctAnswer}"
Student's answer: "${userAnswer}"

Is the student's answer grammatically correct and semantically equivalent to the expected answer?
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

  return NextResponse.json({ correct: false, feedback: "Unbekannter Übungstyp." });
}
