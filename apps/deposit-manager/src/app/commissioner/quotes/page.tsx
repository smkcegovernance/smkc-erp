'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, DepositRequirement, BankQuote, Bank } from '@/lib/deposits/types';
import { depositApi } from '@/lib/deposits';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import LoadingSpinner, { PageLoader, ButtonLoader } from '@/components/deposits/LoadingSpinner';
import { formatAmount } from '@/lib/deposits/formatters';

function CommissionerQuotesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requirementId = searchParams?.get('requirementId');
  
  const [user, setUser] = useState<User | null>(null);
  const [requirements, setRequirements] = useState<DepositRequirement[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [quotes, setQuotes] = useState<BankQuote[]>([]);
  const [requirementQuoteCounts, setRequirementQuoteCounts] = useState<Record<string, number>>({});
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const formatSubmittedAt = (value?: string | null) => {
    if (!value) return 'N/A';
    const text = String(value).trim();

    // API sends timestamps with trailing Z; use the date part directly to avoid day rollover in local timezone.
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (dateOnly) {
      const y = Number(dateOnly[1]);
      const m = Number(dateOnly[2]);
      const d = Number(dateOnly[3]);
      return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? text : parsed.toLocaleDateString('en-IN');
  };

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'commissioner') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadData();
  }, [router]);

  useEffect(() => {
    if (requirementId) {
      setSelectedReqId(requirementId);
      loadQuotes(requirementId);
    }
  }, [requirementId]);

  const loadData = async () => {
    try {
      const [reqData, bankData, allQuotes] = await Promise.all([
        depositApi.getRequirements('commissioner', { status: 'published' }),
        depositApi.getBanks(),
        depositApi.getQuotes('commissioner')
      ]);
      setRequirements(reqData);
      setBanks(bankData);

      const quoteCounts = allQuotes.reduce<Record<string, number>>((acc, quote) => {
        acc[quote.requirementId] = (acc[quote.requirementId] || 0) + 1;
        return acc;
      }, {});
      setRequirementQuoteCounts(quoteCounts);
      
      if (reqData.length > 0 && !requirementId) {
        setSelectedReqId(reqData[0].id);
        loadQuotes(reqData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuotes = async (reqId: string) => {
    try {
      const quotesData = await depositApi.getQuotes('commissioner', reqId);
      setQuotes(quotesData);
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  const handleRequirementChange = (reqId: string) => {
    setSelectedReqId(reqId);
    loadQuotes(reqId);
  };

  const handleFinalize = async (quoteId: string, bankId: string) => {
    if (!confirm('Are you sure you want to finalize this deposit with the selected bank? This action cannot be undone.')) {
      return;
    }

    setFinalizingId(quoteId);
    try {
      await depositApi.finalizeRequirement(selectedReqId, bankId);
      alert('Deposit finalized successfully!');
      loadQuotes(selectedReqId);
      loadData(); // Reload to update requirements list
    } catch (error) {
      alert('Error finalizing deposit');
      console.error(error);
    } finally {
      setFinalizingId(null);
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
      const url = `/api/proxy/consent/download?requirementId=${encodeURIComponent(quote.requirementId)}&bankId=${encodeURIComponent(quote.bankId)}&fileName=${encodeURIComponent(quote.consentFileName)}`;
      console.log('[CommissionerQuotes] Download request', { url, quoteId: quote.id, fileName: quote.consentFileName });
      const res = await fetch(url);
      const ct = res.headers.get('content-type') || '';
      console.log('[CommissionerQuotes] Download response', { status: res.status, contentType: ct });
      if (!res.ok) {
        try {
          const errJson = await res.clone().json();
          const msg = errJson?.message || errJson?.Message || res.statusText || `Download failed (${res.status})`;
          const isEmpty = errJson && Object.keys(errJson).length === 0;
          (isEmpty ? console.warn : console.warn)('[CommissionerQuotes] Error JSON', isEmpty ? 'empty' : errJson);
          alert(msg);
        } catch {
          try {
            const errText = await res.text();
            console.warn('[CommissionerQuotes] Error TEXT', errText || 'empty');
            alert(errText || res.statusText || `Download failed (${res.status})`);
          } catch {
            alert(res.statusText || `Download failed (${res.status})`);
          }
        }
        return;
      }

      if (ct.includes('application/json')) {
        const result = await res.json();
        console.log('[CommissionerQuotes] Consent API JSON response', result);
        const data = result?.data || result;
        const success = result?.success ?? result?.Success;
        const message = result?.message ?? result?.Message;
        console.log('[CommissionerQuotes] JSON payload', { success, message, fileName: data?.fileName, contentType: data?.contentType });
        if (success === false) {
          alert(message || 'Failed to download consent document');
          return;
        }
        const isJpg = /\.(jpg|jpeg)$/i.test(quote.consentFileName || '');
        const contentType = data.contentType || (isJpg ? 'image/jpeg' : 'application/pdf');
        const a = document.createElement('a');
        a.href = `data:${contentType};base64,${data.fileData}`;
        a.download = data.fileName || quote.consentFileName || 'consent-document';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const blob = await res.blob();
        console.log('[CommissionerQuotes] Consent API binary response', { size: blob.size, contentType: ct });
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

  const selectedRequirement = requirements.find(r => r.id === selectedReqId);

  if (!user) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bank Quotes - Finalization</h1>
          <p className="text-gray-600 mt-2">Review quotes and finalize deposit with selected bank</p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <>
            {/* Requirement Selector */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Requirement
              </label>
              <select
                value={selectedReqId}
                onChange={(e) => handleRequirementChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                {requirements.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.schemeName} - {formatAmount(req.amount)} - {req.depositPeriod} Months [{requirementQuoteCounts[req.id] || 0}]
                  </option>
                ))}
              </select>
            </div>

            {/* Requirement Details */}
            {selectedRequirement && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Requirement Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatAmount(selectedRequirement.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Period</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedRequirement.depositPeriod} Months</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{selectedRequirement.depositType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Valid Until</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(selectedRequirement.validityPeriod).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Total Quotes</p>
                    <p className="text-lg font-semibold text-gray-900">{quotes.length}</p>
                  </div>
                </div>
                {selectedRequirement.status === 'finalized' && (
                  <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="text-green-800 font-semibold">✓ This requirement has been finalized</p>
                  </div>
                )}
              </div>
            )}

            {/* Quotes List */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Interest Rate Comparison</h2>
              
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

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            quote.status === 'selected' 
                              ? 'bg-green-100 text-green-700'
                              : quote.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {quote.status.toUpperCase()}
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

                        {quote.status === 'submitted' && quote.rank === 'L1' && selectedRequirement?.status !== 'finalized' && (
                          <button
                            onClick={() => handleFinalize(quote.id, quote.bankId)}
                            disabled={finalizingId === quote.id}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
                          >
                            {finalizingId === quote.id ? (
                              <>
                                <ButtonLoader />
                                <span>Finalizing...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Finalize with this Bank</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CommissionerQuotesPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}> 
      <CommissionerQuotesPageInner />
    </Suspense>
  );
}
