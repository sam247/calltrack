'use client'

export const dynamic = 'force-dynamic'

import { Wizard } from "@/components/onboarding/Wizard";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Wizard onComplete={handleComplete} />
    </div>
  );
}

