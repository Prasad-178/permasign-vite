import { Link } from "react-router-dom";

// A simple placeholder SVG logo. You might want to reuse the one from Navbar.tsx
// or extract it into its own component if you haven't already.
const PermaSignLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Security", href: "#" },
      { label: "FAQ", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
];

export default function AppFooter() {
  return (
    <footer className="border-t border-border/40 bg-background py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4 col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <PermaSignLogo />
              <span className="text-xl font-bold text-foreground">
                PermaSign
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Securely sign and store your documents on the permanent web.
            </p>
          </div>
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} PermaSign. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 