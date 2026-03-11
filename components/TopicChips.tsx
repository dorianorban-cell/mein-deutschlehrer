"use client";

const TOPICS = [
  { label: "Alltag", message: "Lass uns über den Alltag sprechen." },
  { label: "Reisen", message: "Lass uns über Reisen sprechen." },
  { label: "Arbeit", message: "Lass uns über die Arbeit sprechen." },
  { label: "Beziehungen", message: "Lass uns über Beziehungen sprechen." },
  { label: "Politik", message: "Lass uns über Politik sprechen." },
  { label: "Philosophie", message: "Lass uns über Philosophie sprechen." },
  { label: "Kultur", message: "Lass uns über Film, Musik und Kunst sprechen." },
  { label: "Sport", message: "Lass uns über Sport sprechen." },
];

interface Props {
  onSelect: (message: string) => void;
  disabled: boolean;
}

export default function TopicChips({ onSelect, disabled }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {TOPICS.map((topic) => (
        <button
          key={topic.label}
          onClick={() => onSelect(topic.message)}
          disabled={disabled}
          className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {topic.label}
        </button>
      ))}
    </div>
  );
}
