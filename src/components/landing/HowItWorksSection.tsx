import { AnimateOnScroll } from "../ui/animate-on-scroll"
import { UploadCloud, Users, PenSquare, ShieldCheck } from 'lucide-react';

const steps = [
  {
    icon: <UploadCloud className="h-8 w-8 text-primary" />,
    title: "1. Create a Secure Room",
    description: "Establish a private, end-to-end encrypted space for your company. This room acts as a secure vault for all your high-value agreements.",
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: "2. Invite Members & Set Roles",
    description: "Invite team members, investors, or legal counsel to the room. Assign roles with specific permissions to control who can view or sign documents.",
  },
  {
    icon: <PenSquare className="h-8 w-8 text-primary" />,
    title: "3. Upload & Sign Documents",
    description: "Upload documents for signing. All parties sign using their cryptographic keys, creating a permanent, verifiable record on the blockchain.",
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: "4. Permanent, Auditable Storage",
    description: "Once signed, the document is permanently stored on Arweave. A complete, unchangeable audit trail is available for compliance and verification.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-20 md:py-28 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <AnimateOnScroll className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="space-y-3 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">A Simple, Secure Process</h2>
            <p className="text-muted-foreground md:text-xl/relaxed">
              Follow these four simple steps to secure your agreements on the blockchain, ensuring they are permanent, verifiable, and tamper-proof.
            </p>
          </div>
        </AnimateOnScroll>
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2"></div>
          {steps.map((step, index) => (
            <AnimateOnScroll key={index} className={`relative flex items-center my-12 ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                <div className={`p-6 rounded-xl bg-card border shadow-sm feature-card text-left ${index % 2 === 0 ? '' : 'text-right'}`}>
                  <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4 ${index % 2 === 0 ? '' : 'ml-auto'}`}>
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-lg animate-vault-glow">
                  {index + 1}
                </div>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
} 