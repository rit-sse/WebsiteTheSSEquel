"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

type VotingDurationDialogProps = {
  trigger: React.ReactNode;
  onConfirm: (durationHours: number) => void | Promise<void>;
};

const PRESETS = [
  { label: "1 day", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168, recommended: true },
  { label: "14 days", hours: 336 },
];

export default function VotingDurationDialog({
  trigger,
  onConfirm,
}: VotingDurationDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(168);
  const [useCustom, setUseCustom] = useState(false);
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [loading, setLoading] = useState(false);

  const customTotalHours =
    (parseInt(days) || 0) * 24 + (parseInt(hours) || 0) + (parseInt(minutes) || 0) / 60;
  const effectiveHours = useCustom ? customTotalHours : (selectedPreset ?? 0);
  const isValid = effectiveHours >= 0.5 && effectiveHours <= 336;

  function formatDuration(totalHours: number) {
    const d = Math.floor(totalHours / 24);
    const h = Math.floor(totalHours % 24);
    const m = Math.round((totalHours % 1) * 60);
    const parts: string[] = [];
    if (d > 0) parts.push(`${d} day${d !== 1 ? "s" : ""}`);
    if (h > 0) parts.push(`${h} hour${h !== 1 ? "s" : ""}`);
    if (m > 0) parts.push(`${m} min`);
    return parts.join(", ") || "0 minutes";
  }

  async function handleConfirm() {
    if (!isValid) return;
    setLoading(true);
    try {
      // Round to nearest whole hour (minimum 1)
      const roundedHours = Math.max(1, Math.round(effectiveHours));
      await onConfirm(roundedHours);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary/60" />
            Open Member Voting
          </DialogTitle>
          <DialogDescription>
            Primary officers have approved this amendment. Choose how long the
            voting window should be open. Voting starts immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Preset options */}
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.hours}
                type="button"
                onClick={() => {
                  setSelectedPreset(preset.hours);
                  setUseCustom(false);
                }}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors text-left ${
                  !useCustom && selectedPreset === preset.hours
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-surface-3/30 text-foreground"
                }`}
              >
                {preset.label}
                {preset.recommended && (
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Recommended
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Custom option */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setUseCustom(!useCustom)}
              className={`text-sm font-medium transition-colors ${
                useCustom ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {useCustom ? "Using custom duration" : "Or set a custom duration..."}
            </button>
            {useCustom && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={14}
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="0"
                    className="w-16 text-center"
                  />
                  <Label className="text-xs text-muted-foreground">d</Label>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="0"
                    className="w-16 text-center"
                  />
                  <Label className="text-xs text-muted-foreground">h</Label>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="0"
                    className="w-16 text-center"
                  />
                  <Label className="text-xs text-muted-foreground">m</Label>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {isValid && (
            <div className="rounded-lg bg-surface-3/40 px-3 py-2 text-sm text-muted-foreground">
              Voting will be open for{" "}
              <span className="font-semibold text-foreground">
                {formatDuration(effectiveHours)}
              </span>
              {" "}and starts immediately upon confirmation.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="neutral" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !isValid}>
            {loading ? "Starting vote..." : "Start Voting Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
