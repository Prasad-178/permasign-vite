import { CheckCircle } from "lucide-react"
import { AnimateOnScroll } from "../ui/animate-on-scroll"

const securityFeatures = [
  "Robust End-to-End Encryption for all documents", // Emphasizes your strong encryption
  "Advanced Key Management powered by Google Cloud KMS", // Highlights Google KMS usage
  "Strong Cryptographic Protections (e.g., RSA, Symmetric Encryption)", // Specifies the types of encryption
  "Immutable Storage on the Arweave Blockchain", // This remains a key security feature
  "Multi-Factor Authentication for Enhanced Account Security", // Important for user accounts
  "Detailed Audit Trails for Transparency and Accountability", // If you implement this
]

export function SecuritySection() {
  return (
    <section id="security" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          <AnimateOnScroll className="relative">
            <h2 className="text-3xl font-heading font-medium md:text-4xl/tight mb-8">
              Enterprise-Grade Security with Blockchain Permanence
            </h2>
            <ul className="grid gap-4">
              {securityFeatures.map((feature, i) => (
                <li className="flex items-center gap-2" key={i}>
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-light">{feature}</span>
                </li>
              ))}
            </ul>
          </AnimateOnScroll>
          <AnimateOnScroll className="flex items-center justify-center">
            <img
              src="./third_image.png"
              width={600}
              height={600}
              alt="Security Visualization"
              className="rounded-md object-cover shadow-sm"
            />
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  )
} 