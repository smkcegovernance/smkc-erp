'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, DepositRequirement } from '@/lib/deposits/types';
import { mockApi } from '@/lib/deposits';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import LoadingSpinner, { PageLoader, ButtonLoader } from '@/components/deposits/LoadingSpinner';

export default function CommissionerApprovalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requirements, setRequirements] = useState<DepositRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorizingId, setAuthorizingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

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

  const handleAuthorize = async (requirementId: string) => {
    if (!user) return;
    
    setAuthorizingId(requirementId);
    try {
      await mockApi.authorizeRequirement(requirementId, user.id);
      alert('Requirement authorized successfully!');
      loadData();
    } catch (error) {
      alert('Error authorizing requirement');
      console.error(error);
    } finally {
      setAuthorizingId(null);
    }
  };

  const getFilteredRequirements = () => {
    if (filter === 'pending') {
      return requirements.filter(r => r.status === 'draft');
    } else if (filter === 'approved') {
      return requirements.filter(r => r.status !== 'draft');
    }
    return requirements;
  };

  const filteredRequirements = getFilteredRequirements();

  if (!user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Requirement Approvals</h1>
          <p className="text-gray-600 mt-2">Review and authorize deposit requirements</p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <>
            {/* Filter Tabs */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex space-x-2">
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
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'pending' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending ({requirements.filter(r => r.status === 'draft').length})
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'approved' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Approved ({requirements.filter(r => r.status !== 'draft').length})
                </button>
              </div>
            </div>

            {/* Requirements List */}
            {filteredRequirements.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700">No Requirements Found</h3>
                <p className="text-gray-600 mt-2">No requirements match the selected filter</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequirements.map((req) => (
                  <div key={req.id} className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{req.schemeName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            req.status === 'draft' 
                              ? 'bg-red-100 text-red-700'
                              : req.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {req.status === 'draft' ? 'PENDING AUTHORIZATION' : req.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">ID: {req.id}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Amount</p>
                        <p className="text-lg font-semibold text-gray-900">₹ {(req.amount / 100000).toFixed(2)} Lakhs</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Period</p>
                        <p className="text-lg font-semibold text-gray-900">{req.depositPeriod} Months</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <p className="text-lg font-semibold text-gray-900 capitalize">{req.depositType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Date(req.validityPeriod).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {req.specialConditions && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Special Conditions:</p>
                        <p className="text-gray-600">{req.specialConditions}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        <p>Created: {new Date(req.createdAt).toLocaleDateString()}</p>
                        {req.authorizedBy && req.authorizedAt && (
                          <p className="text-green-600 font-medium mt-1">
                            ✓ Authorized on {new Date(req.authorizedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {req.status === 'draft' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => router.push(`/commissioner/requirements/${req.id}`)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleAuthorize(req.id)}
                            disabled={authorizingId === req.id}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
                          >
                            {authorizingId === req.id ? (
                              <>
                                <ButtonLoader />
                                <span>Authorizing...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Authorize</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
