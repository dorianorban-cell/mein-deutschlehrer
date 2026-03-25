export type LessonCategory = "word_order" | "case" | "gender" | "tense" | "vocab";

export type ExerciseType =
  | "fill_blank"
  | "multiple_choice"
  | "fix_sentence"
  | "voice_answer"
  | "spaced_replay"   // warm-up: recall a past mistake
  | "cloze_listen"    // input: hear sentence, fill missing word
  | "translation"     // output: EN → DE
  | "sentence_mutation"; // output: 5 transforms of one base sentence

export type SessionPhase = "warmup" | "practice" | "output";

export interface LessonMistakeInput {
  original: string;
  corrected: string;
  rule: string;
  count?: number;
  lastSeen?: Date;
}

export interface ExplanationStep {
  heading: string;
  text: string;
  examples: string[];
  table?: { label: string; de: string }[];
}

export interface Exercise {
  type: ExerciseType;
  instruction: string;
  prompt: string;
  answer: string;
  options?: string[];      // multiple_choice
  hint?: string;
  phase?: SessionPhase;
  // cloze_listen: full sentence for TTS (prompt has ___ for the gap)
  audioText?: string;
  // spaced_replay: context line shown above the wrong sentence
  context?: string;
  // sentence_mutation: 5 sequential mutation tasks
  mutations?: string[];
  mutationAnswers?: string[];
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
