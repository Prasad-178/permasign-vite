"use client";

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveAddress } from '@arweave-wallet-kit/react'; // Use AWK hook
import { toast } from 'sonner';
import { CustomLoader } from './ui/CustomLoader';

export default function RequireLogin({ children }: { children: React.ReactNode }) {
  const activeAddress = useActiveAddress();
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // AWK handles the connection state, we just check activeAddress
    if (activeAddress === undefined) {
      // Still loading connection status from AWK
      setIsCheckingAuth(true);
    } else if (activeAddress === null) {
      // No wallet connected
      setIsCheckingAuth(false);
      toast.error("Login Required", {
        description: "Please connect your wallet to access this page.",
        duration: 5000,
      });
      navigate('/');
    } else {
      // Wallet is connected
      setIsCheckingAuth(false);
    }
  }, [activeAddress, navigate]);

  if (isCheckingAuth || activeAddress === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <CustomLoader size={40} text="Checking wallet..." />
      </div>
    );
  }

  // Only render children if activeAddress is not null (i.e., wallet connected)
  return activeAddress ? <>{children}</> : null;
}
