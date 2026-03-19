export type LessonCategory = "word_order" | "case" | "gender" | "tense" | "vocab";

export type ExerciseType = "fill_blank" | "multiple_choice" | "fix_sentence" | "voice_answer";

export interface LessonMistakeInput {
  original: string;
  corrected: string;
  rule: string;
}

export interface ExplanationStep {
  text: string;
  example?: string;
}

export interface Exercise {
  type: ExerciseType;
  instruction: string;
  prompt: string;
  answer: string;
  options?: string[];
  hint?: string;
}

export interface LessonContent {
  category: LessonCategory;
  categoryLabel: string;
  ruleHeadline: string;
  explanationSteps: ExplanationStep[];
  exercises: Exercise[];
}

export interface RoleplayScenario {
  id: string;
  label: string;
  description: string;
}

export const ROLEPLAY_SCENARIOS: RoleplayScenario[] = [
  { id: "beziehungen", label: "Beziehungen", description: "relationships, love, friendship" },
  { id: "zukunft", label: "Zukunft & Ziele", description: "future plans, goals, dreams" },
  { id: "psychologie", label: "Psychologie", description: "emotions, habits, self-improvement" },
  { id: "reisen", label: "Reisen", description: "travel, places, experiences" },
  { id: "arbeit", label: "Beruf & Arbeit", description: "work, career, ambitions" },
  { id: "alltag", label: "Alltag", description: "daily life, routines, hobbies" },
];

export const CATEGORY_LABELS: Record<LessonCategory, string> = {
  word_order: "Wortstellung",
  case: "Kasus",
  gender: "Genus",
  tense: "Zeitform",
  vocab: "Vokabular",
};
