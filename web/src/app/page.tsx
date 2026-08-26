import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraphPreview } from "@/components/graph-preview";
import { ProfileButton } from "@/components/profile-button";
import { getWorkerSummaries } from "@/lib/workers";

export default async function Home() {
  const workers = await getWorkerSummaries({ limit: 2 });
  const featuredWorker = workers[0] ?? null;
  const sampleWorker = workers[1] ?? featuredWorker;

  return (
    <div className="min-h-screen">
      {/* Global header */}
      <header className="border-b border-slate-800/40 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-slate-50">
            <Image
              src="/trustnet-logo.svg"
              alt="TrustNet logo"
              width={40}
              height={40}
              priority
            />
            <span className="rounded-full border border-slate-500/40 bg-slate-900 px-3 py-1 text-sm text-slate-50">
              TrustNet
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
            <a href="#how-it-works" className="hover:text-white">
              How it works
            </a>
            <a href="#for-workers" className="hover:text-white">
              For workers
            </a>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <ProfileButton />
            <Link href="/auth/sign-in?mode=signup">
              <Button size="sm" className="px-5">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 pb-16 pt-10 md:px-6 md:pt-16">
        <div className="mx-auto max-w-7xl rounded-2xl border border-slate-800/40 bg-[color:var(--surface)]/95 p-6 shadow-2xl md:p-10">
          {/* Hero */}
          <section className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Image
                  src="/trustnet-logo.svg"
                  alt="TrustNet mark"
                  width={48}
                  height={48}
                  className="drop-shadow-md"
                />
                <div className="space-y-1">
                  <div className="text-sm font-semibold tracking-tight text-slate-900">
                    TrustNet
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Network-backed reputation for real-world work.
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-700">
              For people who do not trust random reviews
            </p>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Find workers trusted by your own network
            </h1>
              <p className="max-w-xl text-base text-slate-600">
                Right now we focus on Lagos. You see electricians, plumbers,
                cleaners and handymen that someone you actually know has hired
                before — with jobs and short comments to back it up.
              </p>
              <div className="flex flex-wrap gap-3 pt-3" />
              <p className="text-xs text-slate-500">
              No public star spam. All referrals come from real people and verified jobs.
            </p>
            </div>

            {/* Right column credibility visual */}
            <div className="space-y-5">
              <Card className="space-y-3 border-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">
                    How your network vouches
                  </h2>
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-800">
                    Graph preview
                  </span>
                </div>
                <div className="rounded-xl border border-dashed border-neutral-200 bg-slate-50 px-3 py-3 text-xs">
                  <GraphPreview />
                </div>
                <p className="text-xs text-neutral-600">
                  This is not a global score. It is how John appears through
                  your own contacts.
                </p>
              </Card>

              {featuredWorker ? (
                <Card className="flex items-center justify-between gap-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="space-y-2 text-sm">
                    <div className="text-[13px] font-medium text-slate-500">
                      Featured worker
                    </div>
                    <div className="text-base font-semibold text-slate-900">
                      {featuredWorker.name}
                    </div>
                    <div className="text-xs text-neutral-600">
                      {featuredWorker.trade} · {featuredWorker.locationLabel}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1 text-[11px] text-neutral-600">
                      {featuredWorker.sentimentTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-neutral-500">Trust score</div>
                    <div className="text-2xl font-semibold text-neutral-900">
                      {featuredWorker.trust.total}
                    </div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      Sentiment {featuredWorker.trust.sentiment} · Referrals{" "}
                      {featuredWorker.trust.referrals} · Verified {featuredWorker.trust.verified}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="flex items-center justify-between gap-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="space-y-2 text-sm">
                    <div className="text-[13px] font-medium text-slate-500">
                      Featured worker
                    </div>
                    <div className="text-base font-semibold text-slate-900">
                      Coming soon
                    </div>
                    <div className="text-xs text-neutral-600">
                      We’ll highlight a trusted worker from your network here.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-neutral-500">Trust score</div>
                    <div className="text-2xl font-semibold text-neutral-900">—</div>
                    <div className="mt-1 text-[11px] text-neutral-500">
                      Sentiment — · Referrals — · Verified —
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </section>

          {/* Credibility strip */}
          <section
            id="how-it-works"
            className="mt-14 rounded-2xl bg-slate-900 text-slate-50 px-5 py-6 md:px-7"
          >
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm text-base font-semibold">
              What we measure instead of random internet stars
            </div>
            <div className="grid flex-1 gap-5 text-sm md:grid-cols-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                  Referrals
                </div>
                <p className="mt-1 text-xs text-slate-200/80">
                  Who brought this worker into your network – neighbour, cousin,
                  colleague – and how many steps away they are from you.
                </p>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                  Sentiment
                </div>
                <p className="mt-1 text-xs text-slate-200/80">
                  Short WhatsApp-style reviews turned into a clear score, not
                  a wall of 5.0 / 5.0 from people you do not recognise.
                </p>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                  Verified jobs
                </div>
                <p className="mt-1 text-xs text-slate-200/80">
                  Jobs where the client confirmed the work and can optionally
                  attach photos or receipts.
                </p>
              </div>
            </div>
          </div>
          </section>

          {/* Differentiator zone */}
          <section className="mt-16 grid gap-10 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-neutral-900">
                Trust beats ratings
              </h2>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <Card className="space-y-3 border-dashed transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="text-[13px] font-semibold text-neutral-800">
                    Generic review app
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-neutral-600">
                    <li>Same 4.8 stars in every city</li>
                    <li>You cannot tell if reviews are bought or swapped</li>
                    <li>Platforms own your rating, not you</li>
                  </ul>
                </Card>
                <Card className="space-y-3 border border-emerald-200 bg-emerald-50 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="text-[13px] font-semibold text-neutral-900">
                    Network-based referrals
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-neutral-700">
                    <li>Every worker tied to named people in your contacts</li>
                    <li>Referrals traced across your network, step by step</li>
                    <li>Workers can carry this reputation off-platform</li>
                  </ul>
                </Card>
            </div>
          </div>

            {sampleWorker && (
              <Card className="space-y-3 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-[13px] font-semibold text-neutral-800">
                  This worker is {sampleWorker.inYourNetworkSteps ?? "a few"} steps from you
                </div>
                <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-4 text-xs text-neutral-600">
                  <div className="flex flex-col gap-1">
                    <div>{sampleWorker.pathToYou ?? "Connections will appear here once your network grows."}</div>
                  </div>
                </div>
                <p className="text-xs text-neutral-500">
                  You see who first used them, who referred them on, and where you
                  sit in that chain.
                </p>
              </Card>
            )}
          </section>

          {/* Sample worker profile teaser */}
          <section
            id="for-workers"
            className="mt-16 flex justify-center px-2 text-sm"
          >
            <Card className="w-full max-w-xl space-y-4 bg-white transition hover:-translate-y-0.5 hover:shadow-md">
              <h2 className="text-base font-semibold text-neutral-900">
                A worker profile with receipts
              </h2>
            <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-base font-medium">
                    {sampleWorker?.name ?? "Your worker"}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {sampleWorker ? `${sampleWorker.trade} · ${sampleWorker.locationLabel}` : "Trade · City"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                    Trust score
                  </div>
                  <div className="text-lg font-semibold">
                    {sampleWorker?.trust.total ?? "—"}
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-neutral-600">
                <div>
                  Sentiment {sampleWorker?.trust.sentiment ?? "—"} · Referrals{" "}
                  {sampleWorker?.trust.referrals ?? "—"} · Verified {sampleWorker?.trust.verified ?? "—"}
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-medium text-neutral-800">
                  Recent verified jobs
                </div>
                <ul className="space-y-1 text-neutral-600">
                  <li>Flat rewiring · Ikeja · Jun 2024 · client A.O. confirmed</li>
                  <li>Office lighting install · Yaba · May 2024 · repeat client</li>
                  <li>Fault tracing and repair · Surulere · Apr 2024 · photo proof</li>
                </ul>
              </div>
            </div>
            <div className="flex justify-end" />
          </Card>
          </section>

          {/* Final CTA */}
          <section className="mt-16 flex flex-col items-center gap-4 text-center">
            <p className="max-w-xl text-base font-medium text-neutral-900">
              Before you call the next random number on Google, check who your
              own network already trusts.
            </p>
          <div className="flex flex-wrap justify-center gap-3" />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-neutral-600">
          <div>© {new Date().getFullYear()} TrustNet</div>
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="hover:text-neutral-900">
              About
            </Link>
            <Link href="/faq" className="hover:text-neutral-900">
              FAQ
            </Link>
            <Link href="/contact" className="hover:text-neutral-900">
              Contact
            </Link>
            <Link href="/terms" className="hover:text-neutral-900">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-neutral-900">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
