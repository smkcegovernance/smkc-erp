'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { depositApi } from '@/lib/deposits';
import { User, DepositRequirement } from '@/lib/deposits/types';
import { formatAmount, formatDate } from '@/lib/deposits/formatters';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import { PageLoader } from '@/components/deposits/LoadingSpinner';

export default function RequirementDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const requirementId = params?.id as string | undefined;
  
  const [user, setUser] = useState<User | null>(null);
  const [requirement, setRequirement] = useState<DepositRequirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'account') {
      router.push('/login');
      return;
    }
    if (!requirementId) {
      console.error('No requirement ID found');
      router.push('/account/requirements');
      return;
    }
    setUser(currentUser);
    loadRequirement();
  }, [router, requirementId]);

  const loadRequirement = async () => {
    try {
      const req = await depositApi.getRequirement(requirementId!, 'account');
      console.log('Requirement loaded:', req);
      setRequirement(req);
    } catch (error) {
      console.error('Error loading requirement:', error);
      alert('Failed to load requirement');
      router.push('/account/requirements');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!requirement || !user || !requirementId) return;
    
    if (!confirm('Are you sure you want to publish this requirement? Banks will be able to submit quotes once published.')) {
      return;
    }

    setPublishing(true);
    try {
      const response = await fetch(`/depositmanager/api/proxy/requirements/${requirementId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorizedBy: user.userId || user.id,
        }),
      });

      if (response.status === 204 || response.ok) {
        alert('Requirement published successfully!');
        router.push('/account/requirements');
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error.message || 'Failed to publish requirement');
      }
    } catch (error) {
      console.error('Error publishing requirement:', error);
      alert('Failed to publish requirement');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!requirement || !requirementId) return;
    
    if (!confirm('Are you sure you want to delete this requirement? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/depositmanager/api/proxy/requirements/${requirementId}`, {
        method: 'DELETE',
      });

      if (response.status === 204 || response.ok) {
        alert('Requirement deleted successfully!');
        router.push('/account/requirements');
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error.message || 'Failed to delete requirement');
      }
    } catch (error) {
      console.error('Error deleting requirement:', error);
      alert('Failed to delete requirement');
    }
  };

  if (!user || loading) {
    return <PageLoader />;
  }

  if (!requirement) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Requirements
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{requirement.schemeName}</h1>
              <p className="text-gray-600">Requirement ID: {requirement.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              requirement.status === 'draft' ? 'bg-gray-100 text-gray-700' :
              requirement.status === 'published' ? 'bg-blue-100 text-blue-700' :
              requirement.status === 'finalized' ? 'bg-green-100 text-green-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {requirement.status?.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Deposit Type</h3>
              <p className="text-lg font-semibold text-gray-900 capitalize">{requirement.depositType}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Amount</h3>
              <p className="text-lg font-semibold text-gray-900">{formatAmount(requirement.amount)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Deposit Period</h3>
              <p className="text-lg font-semibold text-gray-900">{requirement.depositPeriod} Months</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Valid Until</h3>
              <p className="text-lg font-semibold text-gray-900">{formatDate(requirement.validityPeriod)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Created By</h3>
              <p className="text-lg font-semibold text-gray-900">{requirement.createdBy}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Created At</h3>
              <p className="text-lg font-semibold text-gray-900">{formatDate(requirement.createdAt)}</p>
            </div>
          </div>

          {requirement.description && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{requirement.description}</p>
            </div>
          )}

          <div className="flex space-x-4 pt-6 border-t">
            {requirement.status === 'draft' && (
              <>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  {publishing ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Publish Requirement</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </>
            )}

            {requirement.status === 'published' && (
              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">This requirement is published. Banks can now submit quotes.</p>
                </div>
              </div>
            )}

            {requirement.status === 'finalized' && (
              <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium">This requirement has been finalized with a selected bank.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
