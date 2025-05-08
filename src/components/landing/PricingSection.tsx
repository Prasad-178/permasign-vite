import { Link } from "react-router-dom"
import { CheckCircle } from "lucide-react"
import { Button } from "../ui/button"
import { AnimateOnScroll } from "../ui/animate-on-scroll"

const plans = [
  {
    name: "Starter",
    description: "For small teams and startups",
    price: "$29",
    period: "/month",
    features: [
      "Up to 10 documents per month",
      "3 team members",
      "Basic templates",
      "Email support",
    ],
    href: "/signup?plan=starter",
    button: "Get Started",
    highlight: false,
  },
  {
    name: "Business",
    description: "For growing businesses",
    price: "$99",
    period: "/month",
    features: [
      "Up to 100 documents per month",
      "10 team members",
      "Advanced templates",
      "Priority support",
      "API access",
    ],
    href: "/signup?plan=business",
    button: "Get Started",
    highlight: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations",
    price: "Custom",
    period: "",
    features: [
      "Unlimited documents",
      "Unlimited team members",
      "Custom templates",
      "24/7 dedicated support",
      "Advanced security features",
      "Custom integrations",
    ],
    href: "/contact-sales",
    button: "Contact Sales",
    highlight: false,
    outline: true,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <AnimateOnScroll className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-block rounded-full bg-primary-50 px-3 py-1 text-sm text-primary mb-4">
              Pricing
            </div>
            <h2 className="text-3xl font-heading font-medium sm:text-4xl md:text-5xl">Transparent Pricing</h2>
            <p className="text-muted-foreground md:text-xl/relaxed font-light">
              Choose the plan that works for your business needs.
            </p>
          </div>
        </AnimateOnScroll>
        <div className="mx-auto grid max-w-5xl gap-6 py-8 md:grid-cols-3">
          {plans.map((plan, i) => (
            <div className="feature-card" key={i}>
              <div className={`flex flex-col rounded-md border ${plan.highlight ? "border-primary-200 shadow-md relative" : "border-gray-200 shadow-sm"} bg-white p-6 h-full`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Popular
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-2xl font-heading">{plan.name}</h3>
                  <p className="text-muted-foreground font-light">{plan.description}</p>
                </div>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="ml-1 text-muted-foreground">{plan.period}</span>}
                </div>
                <ul className="mt-6 space-y-2 flex-grow">
                  {plan.features.map((feature, j) => (
                    <li className="flex items-center gap-2" key={j}>
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <span className="font-light">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`mt-8 btn-hover-effect ${plan.outline ? "" : "bg-primary hover:bg-primary-600"}`} variant={plan.outline ? "outline" : undefined}>
                  <Link to={plan.href}>{plan.button}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 