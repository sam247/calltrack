import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does call tracking work?",
    answer: "We provide unique tracking phone numbers for each campaign or traffic source. When someone calls that number, we forward the call to your business while capturing attribution data like the source, campaign, keyword, and landing page that drove the call.",
  },
  {
    question: "Will callers notice anything different?",
    answer: "No. The call experience is seamless for your customers. Calls are instantly forwarded to your business line with no delay or quality degradation. Your customers will never know tracking is in place.",
  },
  {
    question: "Can I keep my existing phone numbers?",
    answer: "Absolutely. You can port your existing numbers into CallTrack or use our tracking numbers alongside your current business lines. We support all major carriers and number types.",
  },
  {
    question: "What integrations do you support?",
    answer: "We integrate with all major marketing platforms including Google Ads, Facebook Ads, HubSpot, Salesforce, and more. We also provide a robust API for custom integrations.",
  },
  {
    question: "Is there a contract or commitment?",
    answer: "No long-term contracts required. All plans are month-to-month with the option to cancel anytime. We also offer annual plans with a discount if you prefer.",
  },
  {
    question: "Do you offer a free trial?",
    answer: "Yes! Every new account gets a 14-day free trial with full access to all features. No credit card required to start.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 md:text-4xl lg:text-5xl">
            Frequently asked questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about CallTrack
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border rounded-xl px-6 bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
