'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, DepositRequirement, BankQuote, Bank } from '@/lib/deposits/types';
import { formatAmount } from '@/lib/deposits/formatters';
import { depositApi } from '@/lib/deposits';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import LoadingSpinner, { PageLoader, ButtonLoader } from '@/components/deposits/LoadingSpinner';

export default function CommissionerRequirementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const requirementId = params?.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [requirement, setRequirement] = useState<DepositRequirement | null>(null);
  const [quotes, setQuotes] = useState<BankQuote[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorizingId, setAuthorizingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const formatSubmittedAt = (value?: string | null) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
  };

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'commissioner') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData();
  }, [router, requirementId]);

  const loadData = async () => {
    try {
      const [reqData, quotesData, bankData] = await Promise.all([
        depositApi.getRequirements('commissioner'),
        depositApi.getQuotes('commissioner', requirementId),
        depositApi.getBanks()
      ]);
      
      const req = reqData.find(r => r.id === requirementId);
      setRequirement(req || null);
      setQuotes(quotesData);
      setBanks(bankData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!user || !requirement) return;
    
    setAuthorizingId(requirement.id);
    try {
      await depositApi.authorizeRequirement(requirement.id, user.id);
      alert('Requirement authorized successfully!');
      loadData();
    } catch (error) {
      alert('Error authorizing requirement');
      console.error(error);
    } finally {
      setAuthorizingId(null);
    }
  };

  const getBankName = (bankId: string) => {
    return banks.find(b => b.id === bankId)?.name || 'Unknown Bank';
  };

  const getRankBadge = (rank?: string) => {
    if (!rank) return null;
    
    const colors = {
      L1: 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg',
      L2: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 shadow-md',
      L3: 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-md'
    };
    
    const color = rank === 'L1' ? colors.L1 : rank === 'L2' ? colors.L2 : colors.L3;
    
    return (
      <span className={`px-4 py-2 rounded-lg text-lg font-bold ${color}`}>
        {rank}
      </span>
    );
  };

  const handleDownloadConsent = async (quote: BankQuote) => {
    if (!quote.consentFileName) return;
    try {
      setDownloadingId(quote.id);
      const url = `/depositmanager/api/proxy/consent/download?requirementId=${encodeURIComponent(quote.requirementId)}&bankId=${encodeURIComponent(quote.bankId)}&fileName=${encodeURIComponent(quote.consentFileName)}`;
      const res = await fetch(url);
      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        try {
          const errJson = await res.clone().json();
          const msg = errJson?.message || errJson?.Message || res.statusText || `Download failed (${res.status})`;
          const isEmpty = errJson && Object.keys(errJson).length === 0;
          (isEmpty ? console.warn : console.warn)('[CommissionerRequirement] Error JSON', isEmpty ? 'empty' : errJson);
          alert(msg);
        } catch {
          try {
            const errText = await res.text();
            console.warn('[CommissionerRequirement] Error TEXT', errText || 'empty');
            alert(errText || res.statusText || `Download failed (${res.status})`);
          } catch {
            alert(res.statusText || `Download failed (${res.status})`);
          }
        }
        return;
      }

      if (ct.includes('application/json')) {
        const result = await res.json();
        const data = result?.data || result;
        const success = result?.success ?? result?.Success;
        const message = result?.message ?? result?.Message;
        if (success === false) {
          alert(message || 'Failed to download consent document');
          return;
        }
        const a = document.createElement('a');
        a.href = `data:${data.contentType};base64,${data.fileData}`;
        a.download = data.fileName || quote.consentFileName || 'consent-document';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = quote.consentFileName || 'consent-document.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 0);
      }
    } catch (e) {
      console.error('Failed to download consent document', e);
      alert('Failed to download consent document');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!user) {
    return <PageLoader />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DepositNavigation user={user} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!requirement) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DepositNavigation user={user} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-700">Requirement Not Found</h3>
            <button
              onClick={() => router.push('/commissioner/requirements')}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Back to Requirements
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{requirement.schemeName}</h1>
              <p className="text-gray-600 mt-2">Requirement ID: {requirement.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              requirement.status === 'draft' 
                ? 'bg-red-100 text-red-700'
                : requirement.status === 'published'
                ? 'bg-green-100 text-green-700'
                : requirement.status === 'finalized'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {requirement.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Requirement Details */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Requirement Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Amount</p>
              <p className="text-2xl font-semibold text-gray-900">{formatAmount(requirement.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Deposit Period</p>
              <p className="text-2xl font-semibold text-gray-900">{requirement.depositPeriod} Months</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Deposit Type</p>
              <p className="text-2xl font-semibold text-gray-900 capitalize">{requirement.depositType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Valid Until</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(requirement.validityPeriod).toLocaleDateString()}
              </p>
            </div>
          </div>

          {requirement.specialConditions && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">Special Conditions:</p>
              <p className="text-gray-600">{requirement.specialConditions}</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Created At:</p>
                <p className="font-medium text-gray-900">{new Date(requirement.createdAt).toLocaleString()}</p>
              </div>
              {requirement.authorizedBy && requirement.authorizedAt && (
                <div>
                  <p className="text-gray-500">Authorized At:</p>
                  <p className="font-medium text-green-600">{new Date(requirement.authorizedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Authorization Button */}
          {requirement.status === 'draft' && (
            <div className="mt-6 pt-6 border-t">
              <button
                onClick={handleAuthorize}
                disabled={authorizingId === requirement.id}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                {authorizingId === requirement.id ? (
                  <>
                    <ButtonLoader />
                    <span>Authorizing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Authorize This Requirement</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Bank Quotes */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Bank Quotes ({quotes.length})</h2>
          
          {quotes.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700">No Quotes Submitted</h3>
              <p className="text-gray-600 mt-2">Banks haven't submitted their quotes yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div 
                  key={quote.id} 
                  className={`p-6 rounded-xl border-2 transition-all ${
                    quote.rank === 'L1' 
                      ? 'bg-yellow-50 border-yellow-400 shadow-lg' 
                      : quote.rank === 'L2'
                      ? 'bg-gray-50 border-gray-300 shadow-md'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {getRankBadge(quote.rank)}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{getBankName(quote.bankId)}</h3>
                        <p className="text-sm text-gray-600">
                          Submitted: {formatSubmittedAt(quote.submittedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Interest Rate</p>
                      <p className="text-4xl font-bold text-blue-600">{quote.interestRate}%</p>
                    </div>
                  </div>

                  {quote.remarks && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Remarks:</p>
                      <p className="text-gray-600">{quote.remarks}</p>
                    </div>
                  )}

                  {quote.consentFileName && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Consent Document</p>
                            <p className="text-xs text-gray-600">{quote.consentFileName}</p>
                            <p className="text-xs text-gray-500">
                              {quote.consentFileSize || quote.consentUploadedAt
                                ? `${quote.consentFileSize ? `${(quote.consentFileSize / 1024).toFixed(1)} KB` : 'Size unavailable'}${quote.consentUploadedAt ? ` • Uploaded ${new Date(quote.consentUploadedAt).toLocaleString()}` : ''}`
                                : 'File size and upload time unavailable'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadConsent(quote)}
                          disabled={downloadingId === quote.id}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>{downloadingId === quote.id ? 'Downloading...' : 'Download'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      quote.status === 'selected' 
                        ? 'bg-green-100 text-green-700'
                        : quote.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {quote.status === 'selected' ? 'ACCEPTED' : (quote.status ?? 'submitted').toUpperCase()}
                    </span>
                    {quote.rank === 'L1' && quote.status === 'submitted' && (
                      <span className="text-green-600 font-semibold flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Highest Rate
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => router.push('/commissioner/requirements')}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Back to Requirements
          </button>
          {requirement.status === 'published' && quotes.length > 0 && (
            <button
              onClick={() => router.push(`/commissioner/quotes?requirementId=${requirement.id}`)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              View in Quotes & Finalize
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
