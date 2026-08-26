"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user-store";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  jobId?: string;
  workerId: string;
  onSuccess?: () => void;
}

export function ReviewModal({ open, onClose, jobId, workerId, onSuccess }: ReviewModalProps) {
  const { user } = useUserStore();
  const [text, setText] = useState("");
  const [punctuality, setPunctuality] = useState(4);
  const [communication, setCommunication] = useState(4);
  const [pricingFairness, setPricingFairness] = useState(4);
  const [skill, setSkill] = useState(4);
  const [isReferralBased, setIsReferralBased] = useState(false);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError("Please write a review.");
      return;
    }

    if (!user) {
      setError("You must be signed in to submit a review.");
      return;
    }

    // If no jobId, we need to create a job first (for direct reviews without a job)
    // For now, we require a jobId. In the future, we could create a job automatically.
    if (!jobId) {
      setError("Please select a completed job to review, or create a job offer first.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          text: text.trim(),
          punctuality,
          communication,
          pricingFairness,
          skill,
          isReferralBased,
          referrerId: referrerId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      // Reset form
      setText("");
      setPunctuality(4);
      setCommunication(4);
      setPricingFairness(4);
      setSkill(4);
      setIsReferralBased(false);
      setReferrerId(null);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setText("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 text-sm shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex items-start justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">
              How did this job go
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-neutral-500 hover:text-neutral-800"
            >
              Close
            </button>
          </div>

          {/* Quick review */}
          <div className="mt-4 space-y-1">
            <label
              htmlFor="quickReview"
              className="block text-xs font-medium text-neutral-800"
            >
              Quick review
            </label>
            <textarea
              id="quickReview"
              maxLength={140}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="In 140 characters, what would you tell a friend about this worker"
              className="h-24 w-full resize-none rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs outline-none focus:border-neutral-900"
              required
            />
            <div className="text-[11px] text-neutral-500">{text.length} / 140</div>
          </div>

          {/* Sliders */}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-1 text-xs">
              <div className="font-medium text-neutral-800">Punctuality</div>
              <input
                type="range"
                min={1}
                max={5}
                value={punctuality}
                onChange={(e) => setPunctuality(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-[11px] text-neutral-500">{punctuality} / 5</div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-medium text-neutral-800">Communication</div>
              <input
                type="range"
                min={1}
                max={5}
                value={communication}
                onChange={(e) => setCommunication(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-[11px] text-neutral-500">{communication} / 5</div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-medium text-neutral-800">Pricing fairness</div>
              <input
                type="range"
                min={1}
                max={5}
                value={pricingFairness}
                onChange={(e) => setPricingFairness(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-[11px] text-neutral-500">{pricingFairness} / 5</div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-medium text-neutral-800">Skill</div>
              <input
                type="range"
                min={1}
                max={5}
                value={skill}
                onChange={(e) => setSkill(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-[11px] text-neutral-500">{skill} / 5</div>
            </div>
          </div>

          {/* Referral */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="font-medium text-neutral-800">
              Did someone refer you to this worker?
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsReferralBased(true)}
                className={`flex-1 rounded-full border px-3 py-1.5 text-center text-[11px] ${
                  isReferralBased
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-900"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setIsReferralBased(false)}
                className={`flex-1 rounded-full border px-3 py-1.5 text-center text-[11px] ${
                  !isReferralBased
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-900"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="text-xs text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
            <Button size="sm" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit review"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


