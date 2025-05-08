import { Link } from "react-router-dom";
import { ConnectButton } from "@arweave-wallet-kit/react";

export default function Navbar() {
  return (
    <nav className="bg-neutral-900/50 backdrop-blur-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-white hover:text-primary transition-colors">
          PermaSign
        </Link>
        <ConnectButton
          profileModal={true}
          showBalance={false}
          showProfilePicture={true}
        />
      </div>
    </nav>
  );
} 