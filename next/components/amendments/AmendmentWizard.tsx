"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WizardStepIndicator from "@/components/amendments/WizardStepIndicator";
import EditorStep from "@/components/amendments/wizard/EditorStep";
import ReviewStep from "@/components/amendments/wizard/ReviewStep";
import DetailsStep from "@/components/amendments/wizard/DetailsStep";
import ConfirmStep from "@/components/amendments/wizard/ConfirmStep";

const STEPS = [
  { label: "Edit", shortLabel: "Edit" },
  { label: "Review", shortLabel: "Review" },
  { label: "Details", shortLabel: "Info" },
  { label: "Submit", shortLabel: "Submit" },
];

type AmendmentWizardProps = {
  initialContent: string;
};

export default function AmendmentWizard({ initialContent }: AmendmentWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [proposedContent, setProposedContent] = useState(initialContent);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSemanticChange, setIsSemanticChange] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (proposedContent === initialContent) {
      setError("Please change the constitution text before submitting");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/amendments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          isSemanticChange,
          proposedContent,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to submit amendment");
      }

      const payload = await response.json();
      const amendmentId = payload?.amendment?.id;
      if (!amendmentId) {
        throw new Error("Server did not return amendment id");
      }
      router.push(`/about/constitution/amendments/${amendmentId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit amendment";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <WizardStepIndicator steps={STEPS} currentStep={step} />

      {step === 0 && (
        <EditorStep
          content={proposedContent}
          onChange={setProposedContent}
          originalContent={initialContent}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <ReviewStep
          originalContent={initialContent}
          proposedContent={proposedContent}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <DetailsStep
          title={title}
          description={description}
          isSemanticChange={isSemanticChange}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onSemanticChange={setIsSemanticChange}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <ConfirmStep
          title={title}
          description={description}
          isSemanticChange={isSemanticChange}
          originalContent={initialContent}
          proposedContent={proposedContent}
          loading={loading}
          error={error}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
