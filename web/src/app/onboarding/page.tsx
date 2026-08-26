import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function OnboardingChooseRolePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-xl space-y-6">
        <h1 className="text-lg font-semibold text-neutral-900">
          What brings you here
        </h1>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col justify-between border-neutral-200 bg-neutral-50">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-neutral-900">
                I want to find trusted workers
              </div>
              <p className="text-xs text-neutral-600">
                Search workers through your real network.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/onboarding/client">
                <Button className="w-full" size="md">
                  Continue as client
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="flex flex-col justify-between border-neutral-200 bg-neutral-50">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-neutral-900">
                I offer services
              </div>
              <p className="text-xs text-neutral-600">
                Get referrals and proof of good work.
              </p>
            </div>
            <div className="pt-4">
              <Link href="/onboarding/worker">
                <Button className="w-full" size="md">
                  Continue as worker
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}


