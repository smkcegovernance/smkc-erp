'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, DepositRequirement, BankQuote } from '@/lib/deposits/types';import { formatAmountCompact } from '@/lib/deposits/formatters';import { mockApi } from '@/lib/deposits';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import LoadingSpinner, { PageLoader } from '@/components/deposits/LoadingSpinner';

export default function CommissionerReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requirements, setRequirements] = useState<DepositRequirement[]>([]);
  const [quotes, setQuotes] = useState<BankQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'commissioner') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [reqData, quotesData] = await Promise.all([
        mockApi.getRequirements('commissioner'),
        mockApi.getQuotes()
      ]);
      setRequirements(reqData);
      setQuotes(quotesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return requirements.reduce((sum, req) => sum + req.amount, 0);
  };

  const getAverageInterestRate = () => {
    if (quotes.length === 0) return 0;
    const sum = quotes.reduce((total, q) => total + q.interestRate, 0);
    return (sum / quotes.length).toFixed(2);
  };

  const getFinalizedRequirements = () => {
    return requirements.filter(r => r.status === 'finalized');
  };

  const getPublishedRequirements = () => {
    return requirements.filter(r => r.status === 'published');
  };

  const getPendingRequirements = () => {
    return requirements.filter(r => r.status === 'draft');
  };

  if (!user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive overview of deposit management system</p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requirements</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{requirements.length}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{formatAmountCompact(getTotalAmount())}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{quotes.length}</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Interest Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{getAverageInterestRate()}%</p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Pending Authorization</h3>
                  <span className="text-2xl font-bold text-red-600">{getPendingRequirements().length}</span>
                </div>
                <div className="space-y-2">
                  {getPendingRequirements().slice(0, 3).map(req => (
                    <div key={req.id} className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{req.schemeName}</p>
                      <p className="text-xs text-gray-600">{formatAmountCompact(req.amount)}</p>
                    </div>
                  ))}
                  {getPendingRequirements().length > 3 && (
                    <button
                      onClick={() => router.push('/commissioner/approvals?filter=pending')}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all {getPendingRequirements().length} pending
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Published & Active</h3>
                  <span className="text-2xl font-bold text-green-600">{getPublishedRequirements().length}</span>
                </div>
                <div className="space-y-2">
                  {getPublishedRequirements().slice(0, 3).map(req => (
                    <div key={req.id} className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{req.schemeName}</p>
                      <p className="text-xs text-gray-600">{formatAmountCompact(req.amount)}</p>
                    </div>
                  ))}
                  {getPublishedRequirements().length > 3 && (
                    <button
                      onClick={() => router.push('/commissioner/requirements?filter=published')}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all {getPublishedRequirements().length} published
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Finalized</h3>
                  <span className="text-2xl font-bold text-purple-600">{getFinalizedRequirements().length}</span>
                </div>
                <div className="space-y-2">
                  {getFinalizedRequirements().slice(0, 3).map(req => (
                    <div key={req.id} className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{req.schemeName}</p>
                      <p className="text-xs text-gray-600">{formatAmountCompact(req.amount)}</p>
                    </div>
                  ))}
                  {getFinalizedRequirements().length > 3 && (
                    <button
                      onClick={() => router.push('/commissioner/requirements?filter=finalized')}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all {getFinalizedRequirements().length} finalized
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Requirements */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Requirements</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Scheme Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Period</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.slice(0, 10).map((req) => (
                      <tr 
                        key={req.id} 
                        onClick={() => router.push(`/commissioner/requirements/${req.id}`)}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900">{req.schemeName}</td>
                        <td className="py-3 px-4 text-gray-700">{formatAmountCompact(req.amount)}</td>
                        <td className="py-3 px-4 text-gray-700">{req.depositPeriod} Months</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            req.status === 'draft' 
                              ? 'bg-red-100 text-red-700'
                              : req.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {req.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
