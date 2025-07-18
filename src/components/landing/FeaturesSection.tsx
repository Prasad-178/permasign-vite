import { Lock, Zap, Shield, Globe, Clock, Users } from "lucide-react"
import { AnimateOnScroll } from "../ui/animate-on-scroll"

const features = [
  {
    icon: <Lock className="h-8 w-8 text-primary" />,
    title: "Immutable Records",
    description: "Documents stored on Arweave are permanent and tamper-proof, providing a verifiable, single source of truth.",
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: "Enterprise-Grade Security",
    description: "End-to-end encryption combined with Google Cloud KMS ensures your sensitive documents are always protected.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "Secure Collaboration",
    description: "Invite members, define roles, and manage permissions in a secure, auditable environment.",
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: "Streamlined Workflow",
    description: "An intuitive interface for uploading, signing, and managing high-value agreements efficiently.",
  },
  {
    icon: <Clock className="h-8 w-8 text-primary" />,
    title: "Permanent Audit Trail",
    description: "Every action is recorded on-chain, creating a permanent and transparent audit trail for compliance.",
  },
  {
    icon: <Globe className="h-8 w-8 text-primary" />,
    title: "Decentralized & Global",
    description: "Built on a decentralized network, ensuring your documents are accessible and secure globally, forever.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="w-full py-20 md:py-28 lg:py-32 bg-muted/50">
      <div className="container mx-auto px-4 md:px-6">
        <AnimateOnScroll className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="space-y-3 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Why Choose PermaSign?</h2>
            <p className="text-muted-foreground md:text-xl/relaxed">
              PermaSign combines the unchangeable nature of blockchain with the security of enterprise-grade encryption to protect your most valuable documents.
            </p>
          </div>
        </AnimateOnScroll>
        <div className="mx-auto grid max-w-6xl items-start gap-8 sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature, i) => (
            <AnimateOnScroll key={i} className="feature-card flex flex-col gap-4 p-6 rounded-xl bg-background border shadow-sm hover:shadow-primary/10">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-2">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground mt-2 text-base">{feature.description}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
} 