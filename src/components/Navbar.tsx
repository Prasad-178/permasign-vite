import { Link, useLocation, useNavigate } from "react-router-dom";
import { ConnectButton, useConnection, useActiveAddress } from "@arweave-wallet-kit/react";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { connected } = useConnection();
  const activeAddress = useActiveAddress();
  const posthog = usePostHog();
  const [isUserIdentified, setIsUserIdentified] = useState(false);

  useEffect(() => {
    if (connected && activeAddress && !isUserIdentified) {
      posthog?.identify(activeAddress);
      posthog?.capture("user_logged_in", { wallet_address: activeAddress });
      setIsUserIdentified(true);
    } else if (!connected && isUserIdentified) {
      posthog?.reset();
      setIsUserIdentified(false);
    }
  }, [connected, activeAddress, posthog, isUserIdentified]);

  const navLinks = [
    { type: "anchor", href: "/#features", label: "Features", id: "features" },
    { type: "anchor", href: "/#how-it-works", label: "How It Works", id: "how-it-works" },
    { type: "anchor", href: "/#security", label: "Security", id: "security" },
    { type: "anchor", href: "/#pricing", label: "Pricing", id: "pricing" },
    { type: "route", href: "/companies", label: "My Companies" },
  ];

  const handleAnchorLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    if (location.pathname === "/") {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/', { state: { scrollToId: targetId } });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center space-x-3">
          <img src="/permasign_logo.png" alt="PermaSign Logo" className="h-10 w-auto" />
          <span className="text-2xl font-bold text-foreground hover:text-primary transition-colors">
            PermaSign
          </span>
        </Link>
        
        <nav className="hidden md:flex gap-8 items-center">
          {navLinks.map((link) => {
            const isActive = link.type === 'route' && location.pathname.startsWith(link.href);
            const isHomePage = location.pathname === '/';

            if (link.type === "route") {
              const handleClick = () => {
                if (link.href === "/companies") {
                  posthog?.capture("my_companies_clicked", { location: "navbar" });
                }
              };
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`navbar-link text-lg ${isActive ? 'active' : ''}`}
                  onClick={handleClick}
                >
                  {link.label}
                </Link>
              );
            } else { // type === "anchor"
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleAnchorLinkClick(e, link.id!)}
                  className={`navbar-link text-lg ${isHomePage && '/' + location.hash === link.href ? 'active' : ''}`}
                >
                  {link.label}
                </a>
              );
            }
          })}
        </nav>

        <div className="flex items-center gap-4">
          <ConnectButton
            profileModal={true}
            showBalance={false}
            showProfilePicture={true}
          />
        </div>
      </div>
    </header>
  );
}
 