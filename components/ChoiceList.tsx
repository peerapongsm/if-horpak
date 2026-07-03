import type { Choice } from "@/lib/engine";

interface ChoiceListProps {
  choices: Choice[];
  onChoose: (choice: Choice) => void;
}

export default function ChoiceList({ choices, onChoose }: ChoiceListProps) {
  return (
    <div className="choice-list">
      {choices.map((choice, i) => (
        <button key={i} type="button" className="choice-btn" onClick={() => onChoose(choice)}>
          {choice.label}
        </button>
      ))}
    </div>
  );
}
