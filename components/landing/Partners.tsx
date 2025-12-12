const partners = [
  "Shopify",
  "Stripe",
  "HubSpot",
  "Salesforce",
  "Zendesk",
  "Intercom",
  "Segment",
  "Slack",
];

export function Partners() {
  return (
    <section className="py-12 border-y border-border/50">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by employees at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {partners.map((partner) => (
            <div
              key={partner}
              className="text-lg font-semibold text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
            >
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
