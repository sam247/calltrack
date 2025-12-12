import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Phone, Users } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(0_0%_20%/0.3),transparent)]" />
      
      <div className="container mx-auto px-4 relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Social proof badge */}
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-border bg-card/50 backdrop-blur-sm px-4 py-2 text-sm animate-fade-in">
            <div className="flex -space-x-2">
              <div className="h-6 w-6 rounded-full bg-muted-foreground/20 border-2 border-background flex items-center justify-center">
                <Users className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">2,500+</span> marketing teams trust CallTrack
            </span>
          </div>
          
          {/* Main headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Know exactly where
            <br />
            <span className="text-gradient">every call comes from</span>
          </h1>
          
          {/* Subheadline - focus on the problem/solution */}
          <p className="mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Stop guessing which campaigns drive phone leads. Track, attribute, and optimize every inbound call with precision analytics.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/auth?mode=signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
              <a href="#how-it-works">See How It Works</a>
            </Button>
          </div>

          {/* No credit card note */}
          <p className="mt-4 text-sm text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.35s' }}>
            14-day free trial · No credit card required
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="mx-auto max-w-5xl rounded-xl border border-border bg-card p-1.5 glow">
            <div className="rounded-lg bg-surface-elevated p-4 md:p-6">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-muted" />
                  <div className="h-3 w-3 rounded-full bg-muted" />
                  <div className="h-3 w-3 rounded-full bg-muted" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground">
                    app.calltrack.io/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg bg-background p-4 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Calls</span>
                  </div>
                  <p className="text-3xl font-bold">12,847</p>
                  <p className="text-sm text-success mt-1">↑ 23% from last month</p>
                </div>
                <div className="rounded-lg bg-background p-4 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                  </div>
                  <p className="text-3xl font-bold">34.2%</p>
                  <p className="text-sm text-success mt-1">↑ 5.1% from last month</p>
                </div>
                <div className="rounded-lg bg-background p-4 border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Top Source</span>
                  </div>
                  <p className="text-3xl font-bold">Google Ads</p>
                  <p className="text-sm text-muted-foreground mt-1">4,231 calls attributed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
