import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "$49",
    description: "For small businesses getting started",
    features: [
      "Up to 500 calls/month",
      "1 workspace",
      "Basic analytics",
      "7-day data retention",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: "$149",
    description: "For growing teams that need more",
    features: [
      "Everything in Starter, plus:",
      "Up to 5,000 calls/month",
      "5 workspaces",
      "Advanced analytics",
      "90-day data retention",
      "Priority support",
      "Custom integrations",
      "API access",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$399",
    description: "For agencies and large organizations",
    features: [
      "Everything in Pro, plus:",
      "Unlimited calls",
      "Unlimited workspaces",
      "Custom analytics",
      "Unlimited data retention",
      "Dedicated support",
      "White-label options",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 md:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, scale as you grow. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 transition-all duration-300 ${
                plan.popular
                  ? "border-foreground bg-foreground text-background scale-[1.02] shadow-2xl shadow-foreground/10"
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-background text-foreground px-4 py-1 text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.popular ? "text-background/70" : "text-muted-foreground"}>/month</span>
                </div>
                <p className={plan.popular ? "text-background/70" : "text-muted-foreground"}>
                  {plan.description}
                </p>
              </div>

              <Button
                variant={plan.popular ? "secondary" : "outline"}
                className={`w-full mb-6 ${plan.popular ? "bg-background text-foreground hover:bg-background/90" : ""}`}
                asChild
              >
                <Link href="/auth?mode=signup">{plan.cta}</Link>
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`h-5 w-5 shrink-0 ${plan.popular ? "text-background" : "text-foreground"}`} />
                    <span className={`text-sm ${plan.popular ? "text-background/90" : "text-muted-foreground"}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
