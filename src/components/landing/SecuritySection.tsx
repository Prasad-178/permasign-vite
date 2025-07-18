import { CheckCircle, ArrowRight } from "lucide-react"
import { AnimateOnScroll } from "../ui/animate-on-scroll"
import { Button } from "../ui/button"
import { Link } from "react-router-dom"

const securityFeatures = [
  "End-to-end document encryption (AES-256-GCM)",
  "Master key protection via Google Cloud KMS",
  "Immutable, permanent storage on the Arweave blockchain",
  "On-chain, verifiable audit trails for all actions",
  "Secure, role-based access control for team members",
  "Cryptographically secure signatures via Arweave wallets",
]

export function SecuritySection() {
  return (
    <section id="security" className="w-full py-20 md:py-28 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
          <AnimateOnScroll className="relative">
            <img
              src="./third_image.png"
              width={600}
              height={600}
              alt="Security Visualization"
              className="rounded-xl object-cover shadow-2xl shadow-primary/10"
            />
          </AnimateOnScroll>
          <AnimateOnScroll>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mt-4 mb-6">
              A New Standard for Document Security
            </h2>
            <ul className="grid gap-4 mb-8">
              {securityFeatures.map((feature, i) => (
                <li className="flex items-start gap-3" key={i}>
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-lg">{feature}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="outline" className="btn-hover-effect">
              <Link to="/security">
                Learn More About Our Encryption <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  )
}