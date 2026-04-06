'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, DashboardStats, DepositRequirement } from '@/lib/deposits/types';import { formatAmount } from '@/lib/deposits/formatters';import { depositApi } from '@/lib/deposits';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import LoadingSpinner, { PageLoader } from '@/components/deposits/LoadingSpinner';

export default function BankDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [requirements, setRequirements] = useState<DepositRequirement[]>([]);
  const [quotesMap, setQuotesMap] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'bank') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData(currentUser);
  }, [router]);

  const loadData = async (user: User) => {
    try {
      console.log('Bank dashboard loading data for user:', { userId: user.userId, bankId: user.bankId, role: user.role });
      
      // Load dashboard stats separately since backend might not have this endpoint yet
      let statsData: DashboardStats | null = null;
      try {
        statsData = await depositApi.getDashboardStats('bank', user.userId || user.id, user.bankId);
        console.log('Dashboard stats:', statsData);
      } catch (statsError) {
        console.warn('Dashboard stats endpoint not available (404), using fallback stats');
        // Backend doesn't have dashboard stats endpoint yet - use fallback
        statsData = { activeRequirements: 0, myQuotes: 0, pendingAuthorizations: 0, finalizedRequirements: 0 };
      }
      
      // Load requirements and quotes in parallel
      const [reqData, allQuotes] = await Promise.all([
        depositApi.getRequirements('bank', { status: 'published' }), // GET /api/deposits/bank/requirements?status=published
        depositApi.getQuotes('bank', undefined, user.bankId) // GET /api/deposits/bank/quotes?bankId={bankId}
      ]);
      
      console.log('Requirements:', reqData);
      console.log('Quotes:', allQuotes);
      
      // Calculate stats from actual data if backend doesn't provide them
      if (statsData.activeRequirements === 0 && reqData.length > 0) {
        statsData = {
          activeRequirements: reqData.filter(r => r.status === 'published').length,
          myQuotes: allQuotes.length,
          pendingAuthorizations: allQuotes.filter(q => q.status === 'submitted').length,
          finalizedRequirements: allQuotes.filter(q => q.status === 'selected').length
        };
      }
      
      setStats(statsData);
      const latestRequirements = reqData.slice(0, 3);
      setRequirements(latestRequirements); // Latest 3
      
      // Create map of requirement IDs to whether quote exists
      const map = new Map<string, boolean>();
      allQuotes.forEach(quote => {
        if (quote.requirementId) map.set(String(quote.requirementId), true);
      });
      
      // For any of the displayed requirements not covered by allQuotes,
      // double-check via lightweight endpoint to ensure correct button state
      const toCheck = latestRequirements
        .map(r => r.id)
        .filter(id => !map.get(id));
      
      if (toCheck.length > 0 && user.bankId) {
        try {
          const results = await Promise.all(
            toCheck.map(async (id) => {
              const res = await depositApi.checkQuoteExists(id, user.bankId as string);
              return { id, hasQuote: !!res?.hasQuote };
            })
          );
          results.forEach(r => { if (r.hasQuote) map.set(r.id, true); });
        } catch (e) {
          console.warn('checkQuoteExists fallback failed:', e);
        }
      }
      setQuotesMap(map);
    } catch (error) {
      console.error('Error loading bank dashboard data:', error);
      // Set empty data on error so UI doesn't break
      setStats({ activeRequirements: 0, myQuotes: 0, pendingAuthorizations: 0, finalizedRequirements: 0 });
      setRequirements([]);
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bank Dashboard</h1>
          <p className="text-gray-600 mt-2">View deposit requirements and submit your quotes</p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Requirements</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeRequirements || 0}</p>
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
                    <p className="text-sm font-medium text-gray-600">My Quotes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.myQuotes || 0}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Selected Quotes</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.selectedQuotes || 0}</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requirements</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalRequirements || 0}</p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/bank/requirements')}
                  className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>View All Requirements</span>
                </button>

                <button
                  onClick={() => router.push('/bank/quotes')}
                  className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>My Quotes</span>
                </button>
              </div>
            </div>

            {/* Latest Requirements */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Latest Requirements</h2>
              <div className="space-y-4">
                {requirements.map((req) => (
                  <div key={req.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{req.schemeName}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>{formatAmount(req.amount)}</span>
                          <span>•</span>
                          <span>{req.depositPeriod} Months</span>
                          <span>•</span>
                          <span className="capitalize">{req.depositType}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/bank/requirements/${req.id}`)}
                        className={`px-4 py-2 ${quotesMap.get(req.id) ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg text-sm font-medium transition-colors`}
                      >
                        {quotesMap.get(req.id) ? 'View Quote' : 'Submit Quote'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
