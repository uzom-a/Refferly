"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserStore } from "@/store/user-store";
import type { AuthUser, UserRole } from "@/lib/types";
type AuthMode = "signin" | "signup";

function SignInInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [role, setRole] = useState<UserRole>("CLIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const initialMode = searchParams.get("mode");
    if (initialMode === "signup") {
      setMode("signup");
    } else if (initialMode === "signin") {
      setMode("signin");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password || (mode === "signup" && !name)) {
      setError("Please fill in all required fields.");
      return;
    }

    const endpoint = mode === "signup" ? "/api/auth/sign-up" : "/api/auth/sign-in";
    const payload =
      mode === "signup"
        ? { email, password, name, role }
        : {
            email,
            password,
          };

    try {
      setLoading(true);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? "Something went wrong. Try again.");
      }

      const user: AuthUser = data.user;
      setUser(user);
      localStorage.setItem("trustnet:user", JSON.stringify(user));
      setSuccess(mode === "signup" ? "Account created. Redirecting..." : "Welcome back!");

      const destination = user.role === "CLIENT" ? "/dashboard/client" : "/dashboard/worker";
      router.push(destination);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to complete the request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50 md:flex-row">
      {/* Animated gradient side – desktop */}
      <div className="auth-hero-bg relative hidden flex-1 flex-col justify-between p-10 text-slate-50 md:flex">
        <div className="relative z-10 flex items-center justify-between text-xs uppercase tracking-[0.2em]">
          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px]">
            TrustNet
          </span>
          <span className="text-white/60">Network-backed reputation</span>
        </div>
        <div className="relative z-10 max-w-md space-y-4">
          <p className="text-[11px] font-medium text-teal-100">
            For people who do not trust random reviews
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-slate-50">
            Sign in to see which workers your network already trusts.
          </h1>
          <p className="text-xs text-slate-200/80">
            We map referrals, verified jobs, and real sentiment into a clear,
            auditable trust graph — no star spam, no anonymous piles of ratings.
          </p>
        </div>
        <div className="relative z-10 text-[11px] text-slate-200/70">
          <p>Every connection is a real person vouching for real work.</p>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-1 items-center justify-center bg-[color:var(--surface)] px-4 py-10 sm:px-6">
        <Card className="w-full max-w-md rounded-2xl border-slate-200/40 bg-[color:var(--surface-elevated)] p-6 shadow-lg sm:p-7">
          <div className="mb-4 flex items-center justify-between text-xs">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-100">
              Sign in
            </span>
          </div>

          <h2 className="text-lg font-semibold text-slate-900">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {mode === "signin"
              ? "Sign in with your email and password to continue."
              : "Create an account to start building and viewing your trust network."}
          </p>

          {mode === "signup" && (
            <div className="mt-3 flex gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setRole("CLIENT")}
                className={`rounded-full px-3 py-1 ${
                  role === "CLIENT" ? "bg-slate-900 text-slate-50" : "bg-slate-100 text-slate-700"
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole("WORKER")}
                className={`rounded-full px-3 py-1 ${
                  role === "WORKER" ? "bg-slate-900 text-slate-50" : "bg-slate-100 text-slate-700"
                }`}
              >
                Worker
              </button>
            </div>
          )}

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="space-y-1 text-sm">
                <label
                  htmlFor="fullName"
                  className="block text-xs font-medium text-slate-800"
                >
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-700"
                  placeholder="Jane Doe"
                />
              </div>
            )}
            <div className="space-y-1 text-sm">
              <label
                htmlFor="email"
                className="block text-xs font-medium text-slate-800"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-700"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1 text-sm">
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-800"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-teal-700"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700">
                {success}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={
                loading || !email || !password || (mode === "signup" && !name.trim())
              }
            >
              {loading
                ? "Please wait..."
                : mode === "signin"
                  ? "Continue"
                  : "Create account"}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-center text-xs text-slate-500">
            <div>
              {mode === "signin" ? (
                <>
                  <span>Need an account?</span>{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-semibold text-slate-900 underline-offset-2 hover:underline"
                  >
                    Create one
                  </button>
                </>
              ) : (
                <>
                  <span>Already have an account?</span>{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="font-semibold text-slate-900 underline-offset-2 hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="font-semibold text-slate-400 underline-offset-2 hover:text-slate-600"
            >
              ← Back to home
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200 text-sm">
          Loading sign-in...
        </div>
      }
    >
      <SignInInner />
    </Suspense>
  );
}


