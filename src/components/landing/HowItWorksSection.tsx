import { AnimateOnScroll } from "../ui/animate-on-scroll"

const steps = [
  {
    number: 1,
    title: "Upload Your Document",
    description: "Upload any document format to the PermaSign platform.",
  },
  {
    number: 2,
    title: "Add Signatories",
    description: "Specify who needs to sign and in what order.",
  },
  {
    number: 3,
    title: "Secure Signing",
    description: "Parties sign securely with multi-factor authentication.",
  },
  {
    number: 4,
    title: "Permanent Storage",
    description: "Document is permanently stored on Arweave with blockchain verification.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <AnimateOnScroll className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-block rounded-full bg-primary-50 px-3 py-1 text-sm text-primary mb-4">
              Our Method
            </div>
            <h2 className="text-3xl font-heading font-medium sm:text-4xl md:text-5xl">Understanding the PermaSign Journey</h2>
            <p className="text-muted-foreground md:text-xl/relaxed font-light">
              Discover the straightforward steps to achieve lasting security and verifiability for all your important digital documents.
            </p>
          </div>
        </AnimateOnScroll>
        <div className="mx-auto grid max-w-5xl items-center gap-12 py-8 md:grid-cols-2">
          <AnimateOnScroll>
            <img
              src="./second_image.png"
              width={600}
              height={600}
              alt="PermaSign Workflow"
              className="mx-auto overflow-hidden rounded-md object-cover object-center sm:w-full shadow-sm"
            />
          </AnimateOnScroll>
          <AnimateOnScroll className="flex flex-col justify-center space-y-6">
            <ul className="grid gap-6">
              {steps.map((step) => (
                <li className="flex items-start gap-4" key={step.number}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-heading">{step.title}</h3>
                    <p className="text-muted-foreground font-light">{step.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  )
} 