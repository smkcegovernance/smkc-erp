'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import LoadingSpinner, { PageLoader } from '@/components/deposits/LoadingSpinner';
import { authService } from '@/lib/deposits/auth';
import { depositApi } from '@/lib/deposits';
import { User, UserProfile } from '@/lib/deposits/types';

export default function UserProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadProfile(currentUser);
  }, [router]);

  const resolveBankName = async (bankId?: string) => {
    if (!bankId) return undefined;
    try {
      const banks = await depositApi.getBanks();
      const match = banks.find((bank) => String(bank.id || '').toUpperCase() === String(bankId).toUpperCase());
      return match?.name;
    } catch {
      return undefined;
    }
  };

  const loadProfile = async (currentUser: User) => {
    try {
      const bankName = currentUser.role === 'bank'
        ? await resolveBankName(currentUser.bankId)
        : undefined;
      setProfile({
        userId: currentUser.userId || currentUser.id,
        role: currentUser.role,
        roleId: currentUser.roleId,
        name: currentUser.name,
        status: currentUser.status,
        bankId: currentUser.bankId,
        bankName: bankName || currentUser.bankName,
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600 mt-2">View your profile details and account information</p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">User ID</p>
                <p className="text-lg text-gray-900 font-semibold">{profile?.userId || user.userId || user.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                <p className="text-lg text-gray-900 font-semibold">{profile?.name || user.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Account Status</p>
                <div className="inline-flex">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {profile?.status || user.status || 'Active'}
                  </span>
                </div>
              </div>

              {(profile?.roleId === 3 || profile?.role === 'bank' || user.role === 'bank') && (
                <>
                  <div className="border-t border-gray-200 pt-6">
                    <p className="text-sm font-medium text-gray-500 mb-1">Bank ID</p>
                    <p className="text-lg text-gray-900 font-semibold">{profile?.bankId || user.bankId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Bank Name</p>
                    <p className="text-lg text-gray-900 font-semibold">{profile?.bankName || user.bankName || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/profile/change-password"
                className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Change Password →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
