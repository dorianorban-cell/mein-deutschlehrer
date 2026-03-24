export type LessonCategory = "word_order" | "case" | "gender" | "tense" | "vocab";

export type ExerciseType = "fill_blank" | "multiple_choice" | "fix_sentence" | "voice_answer";

export interface LessonMistakeInput {
  original: string;
  corrected: string;
  rule: string;
  count?: number;    // how many times this mistake was recorded
  lastSeen?: Date;   // when last seen in conversation
}

export interface ExplanationStep {
  heading: string;          // bold title shown large on the slide
  text: string;             // 2–3 sentences Max speaks aloud
  examples: string[];       // 3+ example sentences displayed visually
  table?: { label: string; de: string }[];  // declension/conjugation table rows
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
  {
    id: "gym",
    label: "Im Fitnessstudio",
    description: "Du triffst einen Bekannten im Fitnessstudio. Ihr redet über Training, Fortschritte und Pläne für die Woche. Du bist der/die Sportler/in, Max ist dein Bekannter.",
  },
  {
    id: "store",
    label: "Im Supermarkt",
    description: "Eine fremde Person spricht dich im Supermarkt an und sucht ein Produkt. Ihr kommt ins Gespräch an der Kasse — über Rezepte, Preise, den Alltag. Du bist der Kunde, Max ist die fremde Person.",
  },
  {
    id: "runclub",
    label: "Laufclub",
    description: "Du bist zum ersten Mal beim Laufclub und lernst die anderen Mitglieder kennen. Max ist ein erfahrenes Mitglied, das dich begrüßt und Fragen stellt.",
  },
  {
    id: "cafe",
    label: "Im Café",
    description: "Du setzt dich in einem vollen Café an einen Tisch mit einer fremden Person und kommt ins Gespräch — über Arbeit, die Stadt, das Leben. Max spielt die fremde Person.",
  },
  {
    id: "job",
    label: "Vorstellungsgespräch",
    description: "Du bewirbst dich für eine interessante Stelle. Max ist der Personalleiter und führt das Vorstellungsgespräch mit dir auf Deutsch.",
  },
  {
    id: "arzt",
    label: "Beim Arzt",
    description: "Du bist beim Arzt und erklärst deine Symptome und Krankengeschichte. Max spielt den Arzt und stellt detaillierte Fragen.",
  },
];

export const CATEGORY_LABELS: Record<LessonCategory, string> = {
  word_order: "Wortstellung",
  case: "Kasus",
  gender: "Genus",
  tense: "Zeitform",
  vocab: "Vokabular",
};
