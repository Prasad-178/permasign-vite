import { Link, useLocation, useNavigate } from "react-router-dom";
import { ConnectButton } from "@arweave-wallet-kit/react";
import { ThemeToggle } from "./ThemeToggle";

// A simple placeholder SVG logo. Replace with your actual logo component or SVG.
const PermaSignLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { type: "anchor", href: "/#features", label: "Features", id: "features" },
    { type: "anchor", href: "/#how-it-works", label: "How It Works", id: "how-it-works" },
    { type: "anchor", href: "/#security", label: "Security", id: "security" },
    { type: "anchor", href: "/#pricing", label: "Pricing", id: "pricing" },
    { type: "route", href: "/rooms", label: "Rooms", customClass: "font-semibold text-primary hover:text-primary/90" },
  ];

  const handleAnchorLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string, href: string) => {
    event.preventDefault();
    
    if (location.pathname === "/") {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        console.warn(`Element with ID '${targetId}' not found on homepage.`);
      }
    } else {
      navigate('/', { state: { scrollToId: targetId } });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <PermaSignLogo />
          <span className="text-xl font-bold text-foreground hover:text-primary transition-colors">
            PermaSign
          </span>
        </Link>
        
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => {
            const commonClasses = "text-sm font-medium transition-colors";
            if (link.type === "route") {
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`${commonClasses} ${link.customClass || 'text-muted-foreground hover:text-primary'}`}
                >
                  {link.label}
                </Link>
              );
            } else { // type === "anchor"
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleAnchorLinkClick(e, link.id!, link.href)}
                  className={`${commonClasses} text-muted-foreground hover:text-primary`}
                >
                  {link.label}
                </a>
              );
            }
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ConnectButton
            profileModal={true}
            showBalance={false}
            showProfilePicture={true}
          />
          {/* <ThemeToggle /> */}
          {/* <MobileNav /> */}
        </div>
      </div>
    </header>
  );
} 