import { AnimateOnScroll } from "../ui/animate-on-scroll"
import { Button } from "../ui/button"
import { Link } from "react-router-dom"
import { ArrowRight, Gift } from "lucide-react"

export function PricingSection() {
  return (
    <section id="pricing" className="w-full py-20 md:py-28 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <AnimateOnScroll className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
                <Gift className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Currently in Beta & Free to Use</h2>
            <p className="max-w-2xl text-muted-foreground md:text-xl/relaxed">
              PermaSign is currently in a public beta phase. We invite you to explore the full suite of features, create secure rooms, and manage your agreements with no commitment.
            </p>
            <div className="flex flex-col gap-4 min-[400px]:flex-row pt-6">
                <Button asChild size="lg" className="btn-hover-effect">
                    <Link to="/companies">
                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}
 