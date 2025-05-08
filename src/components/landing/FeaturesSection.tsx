import { Lock, Zap, Shield, Globe, Clock, Users } from "lucide-react"
import { AnimateOnScroll } from "../ui/animate-on-scroll"

const features = [
  {
    icon: <Lock className="h-6 w-6 text-primary" />,
    title: "Immutable Records",
    description: "Documents stored on Arweave are permanent and tamper-proof, providing unmatched security.",
  },
  {
    icon: <Zap className="h-6 w-6 text-primary" />,
    title: "Rapid Processing",
    description: "Sign and process documents quickly with our streamlined workflow.",
  },
  {
    icon: <Shield className="h-6 w-6 text-primary" />,
    title: "Enterprise Security",
    description: "Bank-level encryption combined with blockchain verification for maximum security.",
  },
  {
    icon: <Globe className="h-6 w-6 text-primary" />,
    title: "Global Compliance",
    description: "Meet regulatory requirements worldwide with our compliant signature solution.",
  },
  {
    icon: <Clock className="h-6 w-6 text-primary" />,
    title: "Permanent Storage",
    description: "Never worry about lost documents again with permanent blockchain storage.",
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: "Team Collaboration",
    description: "Seamless collaboration tools for teams of any size to manage documents.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <AnimateOnScroll className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-block rounded-full bg-primary-50 px-3 py-1 text-sm text-primary mb-4">
              Features
            </div>
            <h2 className="text-3xl font-heading font-medium sm:text-4xl md:text-5xl">Enterprise-Grade Features</h2>
            <p className="text-muted-foreground md:text-xl/relaxed font-light">
              PermaSign combines the reliability of traditional e-signature solutions with the permanence and security of blockchain technology.
            </p>
          </div>
        </AnimateOnScroll>
        <div className="mx-auto grid max-w-5xl items-center gap-8 py-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {features.map((feature, i) => (
            <div className="feature-card" key={i}>
              <div className="grid gap-2 p-6 rounded-md bg-white border border-gray-100">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-heading mt-2">{feature.title}</h3>
                <p className="text-muted-foreground font-light">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 