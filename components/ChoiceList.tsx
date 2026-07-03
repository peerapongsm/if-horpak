import type { Choice } from "@/lib/engine";

interface ChoiceListProps {
  choices: Choice[];
  onChoose: (choice: Choice) => void;
}

export default function ChoiceList({ choices, onChoose }: ChoiceListProps) {
  const gridClass = choices.length >= 3 ? "choice-list choice-list-grid" : "choice-list";
  return (
    <div className={gridClass}>
      {choices.map((choice, i) => (
        <button key={i} type="button" className="choice-btn" onClick={() => onChoose(choice)}>
          {choice.label}
        </button>
      ))}
    </div>
  );
}
