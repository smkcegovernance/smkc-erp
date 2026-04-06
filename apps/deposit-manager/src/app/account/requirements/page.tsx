'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, DepositRequirement } from '@/lib/deposits/types';
import { mockApi } from '@/lib/deposits';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import LoadingSpinner, { PageLoader } from '@/components/deposits/LoadingSpinner';
import { formatAmount } from '@/lib/deposits/formatters';

export default function RequirementsListPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requirements, setRequirements] = useState<DepositRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'account') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadRequirements();
  }, [router]);

  const loadRequirements = async () => {
    try {
      const data = await mockApi.getRequirements('account');
      console.log('Requirements loaded:', data);
      console.log('Requirements count:', data?.length);
      setRequirements(data || []);
    } catch (error) {
      console.error('Error loading requirements:', error);
      setRequirements([]);
    } finally {
      setLoading(false);
    }
  };

  const statusFilteredRequirements = filterStatus === 'all'
    ? requirements
    : requirements.filter(r => r.status === filterStatus);

  const normalizeAmount = (value: number) => value.toString();

  const filteredRequirements = statusFilteredRequirements.filter((req) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return true;
    }

    const name = (req.schemeName || '').toLowerCase();
    const amount = normalizeAmount(req.amount).toLowerCase();
    const depositType = (req.depositType || '').toLowerCase();

    return name.includes(term) || amount.includes(term) || depositType.includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filteredRequirements.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRequirements = filteredRequirements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      published: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      finalized: 'bg-blue-100 text-blue-700'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  if (!user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deposit Requirements</h1>
            <p className="text-gray-600 mt-2">Create and manage deposit requirements</p>
          </div>
          <button
            onClick={() => router.push('/account/requirements/create')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <label className="font-semibold text-gray-700">Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="finalized">Finalized</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div className="w-full lg:w-96">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, amount, or deposit type"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="mt-4 text-gray-600">
            Showing {paginatedRequirements.length} of {filteredRequirements.length} matching requirements ({requirements.length} total)
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <div className="grid gap-6">
            {paginatedRequirements.map((req) => (
              <div key={req.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{req.schemeName}</h3>
                      {req.status && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(req.status)}`}>
                          {req.status.toUpperCase()}
                        </span>
                      )}
                      {req.depositType && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          req.depositType === 'callable' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {req.depositType.toUpperCase()}
                        </span>
                      )}
                    </div>
                    {req.description && (
                      <p className="text-gray-600 text-sm mb-3">{req.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div key={`amount-${req.id}`}>
                    <p className="text-xs text-gray-500 mb-1">Amount</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatAmount(req.amount)}
                    </p>
                  </div>
                  <div key={`period-${req.id}`}>
                    <p className="text-xs text-gray-500 mb-1">Period</p>
                    <p className="text-lg font-semibold text-gray-900">{req.depositPeriod} Months</p>
                  </div>
                  <div key={`validity-${req.id}`}>
                    <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(req.validityPeriod).toLocaleDateString()}
                    </p>
                  </div>
                  <div key={`created-${req.id}`}>
                    <p className="text-xs text-gray-500 mb-1">Created</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => router.push(`/account/requirements/${req.id}`)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    View Details
                  </button>
                  {req.status === 'published' && (
                    <button
                      onClick={() => router.push(`/account/quotes?requirementId=${req.id}`)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      View Quotes
                    </button>
                  )}
                </div>
              </div>
            ))}

            {filteredRequirements.length > 0 && totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-md p-4">
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

            {filteredRequirements.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Requirements Found</h3>
                <p className="text-gray-600 mb-4">Create your first deposit requirement to get started</p>
                <button
                  onClick={() => router.push('/account/requirements/create')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                >
                  Create Requirement
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
