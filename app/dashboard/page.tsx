'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth-service';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    AuthService.clearTokens();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="glass-effect rounded-3xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white gradient-text">
              Welcome to Dashboard
            </h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
          
          <div className="text-white">
            <p className="text-lg mb-4">
              You have successfully authenticated! This is your secure dashboard.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="glass-effect rounded-xl p-6 glass-border">
                <h3 className="text-xl font-semibold mb-2">Profile</h3>
                <p className="text-blue-100/70">Manage your account settings and preferences.</p>
              </div>
              <div className="glass-effect rounded-xl p-6 glass-border">
                <h3 className="text-xl font-semibold mb-2">Security</h3>
                <p className="text-blue-100/70">Review your security settings and activity.</p>
              </div>
              <div className="glass-effect rounded-xl p-6 glass-border">
                <h3 className="text-xl font-semibold mb-2">Settings</h3>
                <p className="text-blue-100/70">Configure your application preferences.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
