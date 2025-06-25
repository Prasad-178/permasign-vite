"use client";

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveAddress } from '@arweave-wallet-kit/react'; // Use AWK hook
import { toast } from 'sonner';
import { CustomLoader } from './ui/CustomLoader';

export default function RequireLogin({ children }: { children: React.ReactNode }) {
  const activeAddress = useActiveAddress();
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState<'checking' | 'timedOut' | 'loggedIn' | 'loggedOut'>('checking');

  useEffect(() => {
    if (activeAddress === undefined) {
      const timer = setTimeout(() => {
        setAuthStatus(currentStatus => (currentStatus === 'checking' ? 'timedOut' : currentStatus));
      }, 3000);
      return () => clearTimeout(timer);
    } else if (activeAddress === null) {
      setAuthStatus('loggedOut');
      toast.error("Login Required", {
        description: "Please connect your wallet to access this page.",
        duration: 5000,
      });
      navigate('/');
    } else {
      setAuthStatus('loggedIn');
    }
  }, [activeAddress, navigate]);

  if (authStatus === 'checking') {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <CustomLoader size={40} text="Checking wallet..." />
      </div>
    );
  }

  if (authStatus === 'timedOut') {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <CustomLoader size={40} text="Please log in with your wallet to continue." />
      </div>
    );
  }

  if (authStatus === 'loggedIn') {
    return <>{children}</>;
  }

  return null;
}
