import { 
  TrendingUp, 
  Target, 
  LineChart, 
  Users, 
  Zap,
  Shield,
  Globe
} from "lucide-react";

const benefits = [
  {
    icon: Target,
    title: "Attribute Every Call",
    description: "Know exactly which ads, keywords, and pages drive phone leads. No more guessing.",
  },
  {
    icon: TrendingUp,
    title: "Increase ROI by 40%",
    description: "Optimize spend on campaigns that actually generate quality phone conversations.",
  },
  {
    icon: LineChart,
    title: "Real-Time Insights",
    description: "Monitor call volume, duration, and conversions as they happen with live dashboards.",
  },
  {
    icon: Users,
    title: "Multi-Client Management",
    description: "Manage multiple brands or clients from a single account with isolated workspaces.",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description: "Get tracking numbers and start attributing calls in under 5 minutes.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant with encrypted data storage and role-based access controls.",
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 md:text-4xl lg:text-5xl">
            How CallTrack helps you win
          </h2>
          <p className="text-lg text-muted-foreground">
            Focus on results, not just features. Here is what you get.
          </p>
        </div>

        {/* Bento grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className={`group relative rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:bg-card/80 hover:border-muted-foreground/30 ${
                index === 0 || index === 3 ? "lg:col-span-1" : ""
              }`}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <benefit.icon className="h-6 w-6 text-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
