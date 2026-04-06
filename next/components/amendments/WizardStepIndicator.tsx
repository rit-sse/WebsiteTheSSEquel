"use client";

import { Check } from "lucide-react";

type Step = {
  label: string;
  shortLabel?: string;
};

type WizardStepIndicatorProps = {
  steps: Step[];
  currentStep: number;
};

export default function WizardStepIndicator({
  steps,
  currentStep,
}: WizardStepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="mb-6">
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isFuture = index > currentStep;

          return (
            <li key={step.label} className="flex items-center gap-2 flex-1 last:flex-initial">
              <div className="flex items-center gap-2">
                {/* Step number/check circle */}
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold shrink-0 transition-colors ${
                    isComplete
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-3 text-muted-foreground"
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                {/* Step label — hidden on small screens, show short label instead */}
                <span
                  className={`text-sm font-medium transition-colors hidden sm:inline ${
                    isCurrent
                      ? "text-foreground"
                      : isComplete
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
                <span
                  className={`text-xs font-medium transition-colors sm:hidden ${
                    isCurrent
                      ? "text-foreground"
                      : isComplete
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.shortLabel ?? step.label}
                </span>
              </div>
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-2 hidden sm:block">
                  <div
                    className={`h-0.5 rounded-full transition-colors ${
                      isComplete ? "bg-emerald-500" : "bg-surface-3"
                    }`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
