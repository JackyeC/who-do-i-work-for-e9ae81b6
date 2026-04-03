import { Button } from "@/components/ui/button";
import type { Choice } from "@/types/no-regrets-game";

interface ChoiceButtonsProps {
  choices: Choice[];
  onChoose: (choice: Choice) => void;
  disabled?: boolean;
}

export function ChoiceButtons({ choices, onChoose, disabled }: ChoiceButtonsProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">What do you do?</p>
      {choices.map((choice) => (
        <Button
          key={choice.id}
          variant="outline"
          className="w-full text-left justify-start h-auto py-4 px-5 text-sm leading-relaxed whitespace-normal"
          onClick={() => onChoose(choice)}
          disabled={disabled}
        >
          {choice.label}
        </Button>
      ))}
    </div>
  );
}
