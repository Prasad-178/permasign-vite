import { Link, useLocation, useNavigate } from "react-router-dom";

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
            { label: 'Security', href: '/security' },
            { label: 'Pricing', href: '/#pricing', id: 'pricing' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'Our Team', href: '/team' },
            { label: 'Changelog', href: '/changelog' },
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
      <div className="container mx-auto max-w-screen-2xl px-4 md:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              <img src="/permasign_logo.png" alt="PermaSign Logo" className="h-10 w-auto" />
              <span className="text-2xl font-bold text-foreground">
                PermaSign
              </span>
            </Link>
            <p className="text-base text-muted-foreground max-w-xs">
              On-chain agreements, permanently secured. Built on the Arweave blockchain.
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4 pt-2">
              <h4 className="text-lg font-semibold text-foreground">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.id ? (
                      <a 
                        href={link.href} 
                        onClick={(e) => handleAnchorLinkClick(e, link.id!)}
                        className="text-base text-muted-foreground hover:text-primary transition-colors cursor-pointer footer-link"
                      >
                        {link.label}
                      </a>
                    ) : link.href.startsWith('mailto:') ? (
                        <a href={link.href} className="text-base text-muted-foreground hover:text-primary transition-colors footer-link">
                            {link.label}
                        </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-base text-muted-foreground hover:text-primary transition-colors footer-link"
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
        <div className="mt-16 pt-8 border-t border-border/40 text-center text-base text-muted-foreground">
          © {new Date().getFullYear()} PermaSign. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
 