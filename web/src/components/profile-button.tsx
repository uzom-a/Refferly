"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ProfileButton() {
  const router = useRouter();

  return (
    <Button size="sm" className="px-5" onClick={() => router.push("/auth/sign-in")}>
      Sign in
    </Button>
  );
}

