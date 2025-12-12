import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="relative rounded-3xl border border-border bg-card p-8 md:p-16 text-center overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(0_0%_15%/0.5),transparent)]" />
            
            <div className="relative">
              <h2 className="text-3xl font-bold mb-4 md:text-5xl">
                Ready to track your calls?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join 2,500+ marketing teams who use CallTrack to prove ROI and optimize their campaigns.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="h-12 px-8 text-base" asChild>
                  <Link href="/auth?mode=signup">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
                  <a href="mailto:sales@calltrack.io">Talk to Sales</a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                14-day free trial · No credit card required · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
