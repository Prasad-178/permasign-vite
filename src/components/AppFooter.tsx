import { Link, useLocation, useNavigate } from "react-router-dom";

// A simple placeholder SVG logo. You might want to reuse the one from Navbar.tsx
// or extract it into its own component if you haven't already.
const PermaSignLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

type FooterLinkItem = {
    label: string;
    href: string;
    id?: string;
};

type FooterSection = {
    title: string;
    links: FooterLinkItem[];
};

const footerSections: FooterSection[] = [
    {
        title: 'Product',
        links: [
            { label: 'Features', href: '/#features', id: 'features' },
            { label: 'How it Works', href: '/#how-it-works', id: 'how-it-works' },
            { label: 'Pricing', href: '/#pricing', id: 'pricing' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'Our Team', href: '/team' },
            { label: 'Security', href: '/security' },
        ],
    },
    {
        title: 'Contact',
        links: [
             { label: 'Email Us', href: 'mailto:ar.perma.sign@gmail.com' }
        ]
    }
];

export default function AppFooter() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleAnchorLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    if (location.pathname === "/") {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        navigate('/', { state: { scrollToId: targetId } });
    }
  };

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/permasign_logo.png" alt="PermaSign Logo" className="h-8 w-auto" />
              <span className="text-xl font-bold text-foreground">
                PermaSign
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              On-chain agreements, permanently secured.
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.id ? (
                      <a 
                        href={link.href} 
                        onClick={(e) => handleAnchorLinkClick(e, link.id!)}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        {link.label}
                      </a>
                    ) : link.href.startsWith('mailto:') ? (
                        <a href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                            {link.label}
                        </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} PermaSign.
        </div>
      </div>
    </footer>
  );
} 