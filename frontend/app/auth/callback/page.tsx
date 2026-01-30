'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle OAuth callback
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth/login?error=auth_failed');
          return;
        }

        if (session) {
          // Successful authentication, redirect to dashboard
          router.push('/dashboard');
        } else {
          // No session, redirect to login
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        router.push('/auth/login?error=unexpected');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing authentication...</p>
      </div>
    </div>
  );
}
