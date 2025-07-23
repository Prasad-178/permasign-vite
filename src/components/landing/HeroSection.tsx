import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "../ui/button"
import { AnimateOnScroll } from "../ui/animate-on-scroll"
import { usePostHog } from "posthog-js/react"

export function HeroSection() {
  const posthog = usePostHog()

  const handleGetStartedClick = () => {
    posthog?.capture("get_started_clicked", { location: "hero_section" })
  }

  return (
    <section className="w-full py-20 md:py-32 lg:py-40 xl:py-48 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <AnimateOnScroll className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                On-Chain Agreements, Permanently Secured
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                PermaSign leverages the Arweave blockchain to offer unparalleled document integrity. Secure your critical agreements for generations with cryptographic proof of existence and ownership.
              </p>
            </div>
            <div className="flex flex-col gap-4 min-[400px]:flex-row pt-4">
              <Button asChild size="lg" className="btn-hover-effect" onClick={handleGetStartedClick}>
                <Link to="/companies">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll className="relative flex items-center justify-center">
            <div className="relative w-full max-w-2xl">
                <div className="absolute -inset-2 bg-primary/10 rounded-full blur-3xl animate-pulse-subtle"></div>
                <img
                  src="./first_image.png"
                  width={600}
                  height={600}
                  alt="PermaSign Dashboard Illustration"
                  className="relative mx-auto rounded-2xl shadow-2xl shadow-primary/20"
                />
            </div>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  )
} 