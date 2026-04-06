'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, DepositRequirement } from '@/lib/deposits/types';
import { formatAmount } from '@/lib/deposits/formatters';
import { mockApi } from '@/lib/deposits';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import { PageLoader } from '@/components/deposits/LoadingSpinner';

export default function BankRequirementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requirements, setRequirements] = useState<DepositRequirement[]>([]);
  const [quotesMap, setQuotesMap] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'bank') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadRequirements(currentUser);
  }, [router]);

  const loadRequirements = async (user: User) => {
    try {
      const [reqData, allQuotes] = await Promise.all([
        mockApi.getRequirements('bank', { status: 'published' }),
        mockApi.getQuotes(undefined, user.bankId)
      ]);
      setRequirements(reqData);
      
      // Create map of requirement IDs to whether quote exists
      const map = new Map<string, boolean>();
      allQuotes.forEach(quote => {
        map.set(quote.requirementId, true);
      });
      setQuotesMap(map);
    } catch (error) {
      console.error('Error loading requirements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequirements = requirements.filter(req => {
    const isExpired = new Date(req.validityPeriod) < new Date();
    if (filter === 'active') return !isExpired;
    if (filter === 'expired') return isExpired;
    return true;
  });

  const searchedRequirements = filteredRequirements.filter((req) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return true;
    }

    const schemeName = (req.schemeName || '').toLowerCase();
    const amount = req.amount.toString().toLowerCase();
    const depositType = (req.depositType || '').toLowerCase();
    const id = (req.id || '').toLowerCase();

    return schemeName.includes(term) || amount.includes(term) || depositType.includes(term) || id.includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(searchedRequirements.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!user || loading) {
    return <PageLoader />;
  }

  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequirements = searchedRequirements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Deposit Requirements</h1>
          <p className="text-gray-600 mt-2">View all deposit requirements and submit your quotes</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('active')}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  filter === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Active ({requirements.filter(r => new Date(r.validityPeriod) >= new Date()).length})
              </button>
              <button
                onClick={() => setFilter('expired')}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  filter === 'expired'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Expired ({requirements.filter(r => new Date(r.validityPeriod) < new Date()).length})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({requirements.length})
              </button>
            </div>

            <div className="w-full lg:w-96">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, name, amount, or deposit type"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="mt-4 text-gray-600">
            Showing {paginatedRequirements.length} of {searchedRequirements.length} matching requirements ({requirements.length} total)
          </div>
        </div>

        {/* Requirements List */}
        <div className="space-y-4">
          {searchedRequirements.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Requirements Found</h3>
              <p className="text-gray-600">There are no {filter === 'all' ? '' : filter} requirements at the moment.</p>
            </div>
          ) : (
            paginatedRequirements.map((req) => {
              const isExpired = new Date(req.validityPeriod) < new Date();
              return (
                <div key={req.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{req.schemeName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isExpired ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {isExpired ? 'EXPIRED' : 'ACTIVE'}
                        </span>
                        {req.status === 'finalized' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                            FINALIZED
                          </span>
                        )}
                      </div>
                      {req.description && (
                        <p className="text-gray-600 mb-3">{req.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Deposit Amount</p>
                      <p className="text-lg font-bold text-gray-900">{formatAmount(req.amount)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Period</p>
                      <p className="text-lg font-bold text-gray-900">{req.depositPeriod} Months</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <p className="text-lg font-bold text-gray-900 capitalize">{req.depositType}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(req.validityPeriod).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => router.push(`/bank/requirements/${req.id}`)}
                      className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                        isExpired
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : quotesMap.get(req.id)
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      disabled={isExpired}
                    >
                      {isExpired ? 'Expired' : quotesMap.get(req.id) ? 'View Quote' : 'Submit Quote'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {searchedRequirements.length > 0 && totalPages > 1 && (
          <div className="bg-white rounded-xl shadow-md p-4 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>

              <div className="flex flex-wrap items-center justify-center gap-2">
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg border font-semibold ${
                      page === safeCurrentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
