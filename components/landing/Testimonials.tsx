import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "CallTrack helped us attribute 40% more conversions to our paid campaigns. The ROI insights are invaluable for our clients.",
    author: "Sarah Chen",
    role: "Marketing Director",
    company: "GrowthLab Agency",
    rating: 5,
  },
  {
    quote: "Finally, we can prove to our clients exactly which keywords drive phone calls. Worth every penny.",
    author: "Michael Torres",
    role: "PPC Manager",
    company: "Apex Digital",
    rating: 5,
  },
  {
    quote: "The multi-tenant setup is perfect for managing all our franchise locations from one dashboard.",
    author: "Jennifer Walsh",
    role: "Operations Lead",
    company: "ServicePro Network",
    rating: 5,
  },
  {
    quote: "We cut our cost per lead by 35% in the first month just by knowing which campaigns actually worked.",
    author: "David Park",
    role: "CMO",
    company: "HomeServe Pro",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 md:py-32 bg-surface-subtle">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 md:text-4xl lg:text-5xl">
            Loved by marketers worldwide
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our customers have to say
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.author}
              className="rounded-2xl border border-border bg-card p-6"
            >
              {/* Rating stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
                ))}
              </div>
              
              <p className="text-foreground mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-semibold">
                    {testimonial.author.split(" ").map(n => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
