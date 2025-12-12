import { Phone, BarChart3, Zap } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Phone,
    title: "Get Tracking Numbers",
    description: "We provision unique phone numbers for each campaign, landing page, or traffic source you want to track.",
  },
  {
    number: "02",
    icon: BarChart3,
    title: "Calls Are Attributed",
    description: "When someone calls, we automatically capture the source, campaign, keyword, and landing page that drove the call.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Optimize & Scale",
    description: "Use real attribution data to double down on what works and cut what does not. Watch your ROI climb.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-32 bg-surface-subtle">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 md:text-4xl lg:text-5xl">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get started in 3 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
              )}
              
              <div className="text-center">
                <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-2xl bg-card border border-border">
                  <step.icon className="h-10 w-10 text-foreground" />
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Step {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
