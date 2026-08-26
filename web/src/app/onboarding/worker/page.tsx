"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserStore } from "@/store/user-store";
import type { AuthUser } from "@/lib/types";
import { LocationSearchInput, type LocationOption } from "@/components/location-search-input";

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const [hydrated, setHydrated] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("");
  const [locationOption, setLocationOption] = useState<LocationOption | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available skills
  const availableSkills = ["Electrical repair", "Wiring", "Installation"];

  // Hydrate user from localStorage
  useEffect(() => {
    if (hydrated) return;

    try {
      const stored = window.localStorage.getItem("trustnet:user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch {
      window.localStorage.removeItem("trustnet:user");
    } finally {
      setHydrated(true);
    }
  }, [hydrated, setUser]);

  // Redirect if not authenticated or not a worker
  useEffect(() => {
    if (hydrated && (!user || user.role !== "WORKER")) {
      router.push("/auth/sign-in");
    }
  }, [hydrated, user, router]);

  // Prefill with existing profile data when available
  useEffect(() => {
    if (!hydrated || !user?.id || user.role !== "WORKER") {
      return;
    }

    let active = true;
    const currentUserId = user.id;

    async function loadProfile() {
      try {
        const response = await fetch(`/api/worker-profile?userId=${currentUserId}`);
        if (!response.ok) {
          if (active) {
            setPrefillLoading(false);
          }
          return;
        }
        const payload = (await response.json()) as { profile: any };
        if (!active || !payload.profile) return;

        const profile = payload.profile;
        setName(profile.name ?? "");
        setTrade(profile.trade ?? "");

        if (Array.isArray(profile.skills)) {
          setSelectedSkills(profile.skills);
        }

        if (typeof profile.radiusKm === "number") {
          setRadiusKm(profile.radiusKm);
        } else {
          setRadiusKm(null);
        }

        if (
          profile.fullAddress &&
          typeof profile.latitude === "number" &&
          typeof profile.longitude === "number"
        ) {
          setLocationOption({
            id: profile.id,
            label: profile.fullAddress,
            city: profile.city ?? "",
            area: profile.area ?? "",
            state: profile.state ?? "",
            country: profile.country ?? "",
            latitude: profile.latitude,
            longitude: profile.longitude,
          });
        }
      } catch {
        // Silent fail - user can still fill manually
      } finally {
        if (active) {
          setPrefillLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [hydrated, user]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
    );
  };

  const parseRadius = (value: string): number | null => {
    if (value === "Whole city") return null;
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!user?.id) {
      setError("You must be signed in to create a profile.");
      return;
    }

    if (!name.trim() || !trade.trim() || !locationOption) {
      setError("Please fill in all required fields (name, trade, and location).");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/worker-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          name: name.trim(),
          trade: trade.trim(),
          city: locationOption.city,
          area: locationOption.area,
          state: locationOption.state,
          country: locationOption.country,
          fullAddress: locationOption.label,
          latitude: locationOption.latitude,
          longitude: locationOption.longitude,
          skills: selectedSkills.length > 0 ? selectedSkills : undefined,
          radiusKm,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? "Unable to save profile. Please try again.");
      }

      // Refresh auth user so the dashboard greets with the latest name
      try {
        const refreshResponse = await fetch(`/api/users/${user.id}`);
        if (refreshResponse.ok) {
          const refreshed = (await refreshResponse.json()) as { user: AuthUser };
          setUser(refreshed.user);
          window.localStorage.setItem("trustnet:user", JSON.stringify(refreshed.user));
        }
      } catch {
        // Non-blocking - continue even if refresh fails
      }

      // Success - redirect to dashboard
      router.push("/dashboard/worker");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to save profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!hydrated || !user || user.role !== "WORKER" || prefillLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Card className="w-full max-w-sm text-center text-sm text-neutral-600">
          Loading your profile...
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-6">
      <Card className="w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <span>Step 1 of 3</span>
          <Link href="/onboarding" className="underline-offset-2 hover:underline">
            Change role
          </Link>
        </div>
        <h1 className="text-lg font-semibold text-neutral-900">
          Set up your worker profile
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basics */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-900">Basics</h2>
            <div className="grid gap-3 text-sm">
              <div className="space-y-1">
                <label
                  htmlFor="fullName"
                  className="block text-xs font-medium text-neutral-800"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
                  placeholder="John Musa"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="trade"
                  className="block text-xs font-medium text-neutral-800"
                >
                  Trade or profession
                </label>
                <input
                  id="trade"
                  type="text"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  required
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900"
                  placeholder="Electrician"
                />
              </div>
              <LocationSearchInput
                label="Service location"
                selected={locationOption}
                onSelect={setLocationOption}
                required
              />
              {locationOption && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                  <div>
                    <span className="font-medium text-neutral-900">City:</span> {locationOption.city}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900">Area:</span> {locationOption.area}
                  </div>
                  <div className="truncate">
                    <span className="font-medium text-neutral-900">Address:</span>{" "}
                    {locationOption.label}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Step 2: Skills and coverage */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">
                Skills and coverage
              </h2>
              <button
                type="button"
                onClick={() => setSelectedSkills([])}
                className="text-xs text-neutral-600 underline-offset-2 hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap gap-2">
                {availableSkills.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full border px-3 py-1 text-[11px] transition ${
                      selectedSkills.includes(skill)
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-neutral-50 text-neutral-800 hover:border-neutral-900"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-1">
                <div className="text-xs font-medium text-neutral-800">
                  Coverage radius
                </div>
                <select
                  value={radiusKm ? `Within ${radiusKm} km` : "Whole city"}
                  onChange={(e) => setRadiusKm(parseRadius(e.target.value))}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 focus:border-neutral-900"
                >
                  <option>Within 5 km</option>
                  <option>Within 10 km</option>
                  <option>Within 20 km</option>
                  <option>Whole city</option>
                </select>
              </div>
            </div>
          </section>

          {/* Step 3: Verification */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-neutral-900">
              Verification (optional)
            </h2>
            <p className="text-xs text-neutral-600">
              Add proof of who you are. This stays private. It only confirms you
              are real.
            </p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-neutral-700 hover:border-neutral-900"
              >
                <span>Upload ID card</span>
                <span className="text-[11px] text-neutral-500">PNG, JPG, PDF</span>
              </button>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-neutral-700 hover:border-neutral-900"
              >
                <span>Upload business registration</span>
                <span className="text-[11px] text-neutral-500">
                  CAC or equivalent
                </span>
              </button>
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Finish and go to dashboard"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
