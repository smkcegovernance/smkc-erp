'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { ButtonLoader } from '@/components/deposits/LoadingSpinner';

export default function DepositLoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!userId.trim() || !password.trim()) {
      setError('Please enter both User ID and Password');
      return;
    }
    
    setIsLoading(true);

    try {
      const { mockApi } = await import('@/lib/deposits');
      
      // Unified login - API determines role from userId in database
      const response = await mockApi.login(userId, password);
      
      if (response && response.user) {
        // API already returns role field, use it directly
        const user = response.user;
        
        // Store user data in localStorage
        localStorage.setItem('smkc_deposit_auth', JSON.stringify(user));
        
        // Store token if provided
        if (response.token) {
          localStorage.setItem('smkc_deposit_token', response.token);
        }
        
        // Redirect based on role
        if (user.role === 'account') {
          router.push('/account');
        } else if (user.role === 'bank') {
          router.push('/bank');
        } else if (user.role === 'commissioner') {
          router.push('/commissioner');
        }
      } else {
        setError('Invalid credentials. Please try again.');
        setIsLoading(false);
      }
    } catch (error: any) {
      setError(error.message || 'Invalid credentials. Please try again.');
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { role: 'Account Department', userId: 'ACCOUNT1', password: 'account123' },
    { role: 'Commissioner', userId: 'COMMIS01', password: 'c0MM15o1' },
    { role: 'Bank User 1', userId: 'BNK00006', password: 'Bank@006' },
    { role: 'Bank User 2', userId: 'BNK00007', password: 'Bank@007' },
  ];

  const fillCredentials = (userId: string, password: string) => {
    setUserId(userId);
    setPassword(password);
    setError('');
  };

  return (
    <div className="h-screen overflow-hidden bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center mb-4">
              <img
                src="/depositmanager/images/logo.png"
                alt="e-Nivesh"
                width={64}
                height={64}
                loading="eager"
                className="rounded-md shadow-sm"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/depositmanager/next.svg'; }}
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">e-Nivesh</h1>
            <p className="text-gray-600">Sangli Miraj Kupwad City Municipal Corporation</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="userId" className="block text-sm font-semibold text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value.toUpperCase())}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed uppercase"
                placeholder="Enter User ID"
              />
              <p className="text-xs text-gray-500 mt-1">e.g., PTTEST01</p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter Password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <ButtonLoader />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Secure login for authorized users only</p>
          </div>
        </div>

        {/* Removed demo credentials section */}
      </div>
    </div>
  );
}
