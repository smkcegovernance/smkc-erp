'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, DepositRequirement } from '@/lib/deposits/types';
import { formatAmount } from '@/lib/deposits/formatters';
import { mockApi } from '@/lib/deposits';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import LoadingSpinner, { PageLoader } from '@/components/deposits/LoadingSpinner';

export default function CommissionerRequirementsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requirements, setRequirements] = useState<DepositRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'finalized' | 'invalidated'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

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
      const reqData = await mockApi.getRequirements('commissioner');
      setRequirements(reqData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRequirements = () => {
    if (filter === 'all') {
      return requirements;
    }
    return requirements.filter(r => r.status === filter);
  };

  const statusFilteredRequirements = getFilteredRequirements();

  const normalizeAmount = (value: number) => value.toString();

  const filteredRequirements = statusFilteredRequirements.filter((req) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return true;
    }

    const name = (req.schemeName || '').toLowerCase();
    const amount = normalizeAmount(req.amount).toLowerCase();
    const depositType = (req.depositType || '').toLowerCase();
    const id = (req.id || '').toLowerCase();

    return name.includes(term) || amount.includes(term) || depositType.includes(term) || id.includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filteredRequirements.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequirements = filteredRequirements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  if (!user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Requirements</h1>
          <p className="text-gray-600 mt-2">Browse and manage all deposit requirements</p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'all' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({requirements.length})
                  </button>
                  <button
                    onClick={() => setFilter('draft')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'draft' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Draft ({requirements.filter(r => r.status === 'draft').length})
                  </button>
                  <button
                    onClick={() => setFilter('published')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'published' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Published ({requirements.filter(r => r.status === 'published').length})
                  </button>
                  <button
                    onClick={() => setFilter('finalized')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'finalized' 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Finalized ({requirements.filter(r => r.status === 'finalized').length})
                  </button>
                  <button
                    onClick={() => setFilter('invalidated')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === 'invalidated' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Invalidated ({requirements.filter(r => r.status === 'invalidated').length})
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
                Showing {paginatedRequirements.length} of {filteredRequirements.length} matching requirements ({requirements.length} total)
              </div>
            </div>

            {/* Requirements Grid */}
            {filteredRequirements.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700">No Requirements Found</h3>
                <p className="text-gray-600 mt-2">No requirements match the selected filter</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {paginatedRequirements.map((req) => (
                  <div 
                    key={req.id} 
                    onClick={() => router.push(`/commissioner/requirements/${req.id}`)}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-600"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{req.schemeName}</h3>
                        <p className="text-sm text-gray-600">ID: {req.id}</p>
                      </div>
                      {req.status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          req.status === 'draft' 
                            ? 'bg-red-100 text-red-700'
                            : req.status === 'published'
                            ? 'bg-green-100 text-green-700'
                            : req.status === 'finalized'
                            ? 'bg-purple-100 text-purple-700'
                            : req.status === 'invalidated'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {req.status === 'invalidated' ? 'INVALIDATED BY SMKC' : req.status.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="text-lg font-semibold text-gray-900">{formatAmount(req.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Period</p>
                        <p className="text-lg font-semibold text-gray-900">{req.depositPeriod} Months</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">{req.depositType || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(req.validityPeriod).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        Created: {new Date(req.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center space-x-2 text-blue-600 font-medium text-sm">
                        <span>View Details</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredRequirements.length > 0 && totalPages > 1 && (
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
          </>
        )}
      </div>
    </div>
  );
}
