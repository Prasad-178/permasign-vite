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
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <AnimateOnScroll className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <div className="inline-block rounded-full bg-primary-50 px-3 py-1 text-sm text-primary mb-4">
                The Future of Secure Agreements
              </div>
              <h1 className="text-3xl font-heading font-semibold sm:text-5xl xl:text-6xl/none">
                Verify & Preserve: Your Documents, Eternally Secure.
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl font-light">
                Experience unparalleled document integrity with PermaSign, powered by Arweave's permanent web. Your critical files, validated and stored for generations.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary-600 btn-hover-effect" onClick={handleGetStartedClick}>
                <Link to="/companies">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll className="relative">
            <img
              src="./first_image.png"
              width={550}
              height={550}
              alt="PermaSign Dashboard"
              className="mx-auto aspect-video overflow-hidden rounded-md object-cover object-center sm:w-full lg:order-last shadow-sm"
            />
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  )
} 