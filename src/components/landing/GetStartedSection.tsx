import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "../ui/button"
import { AnimateOnScroll } from "../ui/animate-on-scroll"

export function GetStartedSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <AnimateOnScroll className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-block rounded-full bg-primary-50 px-3 py-1 text-sm text-primary mb-4">
              Get Started
            </div>
            <h2 className="text-3xl font-heading font-medium sm:text-4xl md:text-5xl">Ready to Get Started?</h2>
            <p className="text-muted-foreground md:text-xl/relaxed font-light">
              Join thousands of businesses that trust PermaSign for their document signing needs.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row pt-6">
            <Button asChild size="lg" className="bg-primary hover:bg-primary-600 btn-hover-effect">
              <Link to="/signup">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="btn-hover-effect border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Link to="/contact-sales">Contact Sales</Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
} 
