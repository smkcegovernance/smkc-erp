'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/deposits/auth';
import { User, BankQuote, DepositRequirement } from '@/lib/deposits/types';
import { depositApi } from '@/lib/deposits';
import DepositNavigation from '@/components/deposits/DepositNavigation';
import { PageLoader } from '@/components/deposits/LoadingSpinner';

export default function BankQuotesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [quotes, setQuotes] = useState<BankQuote[]>([]);
  const [requirementsMap, setRequirementsMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 6;

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
    if (!currentUser || currentUser.role !== 'bank') {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadQuotes(currentUser);
  }, [router]);

  const loadQuotes = async (user: User) => {
    try {
      const [quoteData, requirementsData] = await Promise.all([
        depositApi.getQuotes('bank', undefined, user.bankId),
        depositApi.getRequirements('bank')
      ]);

      setQuotes(quoteData);

      const reqMap = new Map<string, string>();
      (requirementsData || []).forEach((req: DepositRequirement) => {
        reqMap.set(req.id, req.schemeName || 'Unknown Scheme');
      });
      setRequirementsMap(reqMap);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadConsent = async (quote: BankQuote) => {
    if (!user || !quote.consentFileName) return;
    try {
      setDownloadingId(quote.id);
      const url = `/api/proxy/consent/download?requirementId=${encodeURIComponent(quote.requirementId)}&bankId=${encodeURIComponent(quote.bankId)}&fileName=${encodeURIComponent(quote.consentFileName)}`;
      console.log('[BankQuotes] Download request', { url, quoteId: quote.id, fileName: quote.consentFileName });
      const res = await fetch(url);
      const ct = res.headers.get('content-type') || '';
      console.log('[BankQuotes] Download response', { status: res.status, contentType: ct });
      if (!res.ok) {
        try {
          const errJson = await res.clone().json();
          const msg = errJson?.message || errJson?.Message || res.statusText || `Download failed (${res.status})`;
          const isEmpty = errJson && Object.keys(errJson).length === 0;
          (isEmpty ? console.warn : console.warn)('[BankQuotes] Error JSON', isEmpty ? 'empty' : errJson);
          alert(msg);
        } catch {
          try {
            const errText = await res.text();
            console.warn('[BankQuotes] Error TEXT', errText || 'empty');
            alert(errText || res.statusText || `Download failed (${res.status})`);
          } catch {
            alert(res.statusText || `Download failed (${res.status})`);
          }
        }
        return;
      }

      if (ct.includes('application/json')) {
        const result = await res.json();
        console.log('[BankQuotes] Consent API JSON response', result);
        const data = result?.data || result;
        const success = result?.success ?? result?.Success;
        const message = result?.message ?? result?.Message;
        console.log('[BankQuotes] JSON payload', { success, message, fileName: data?.fileName, contentType: data?.contentType });
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
        console.log('[BankQuotes] Consent API binary response', { size: blob.size, contentType: ct });
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

  const filteredQuotes = quotes.filter((quote) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return true;
    }

    const requirementId = (quote.requirementId || '').toLowerCase();
    const schemeName = (quote.schemeName || requirementsMap.get(quote.requirementId) || '').toLowerCase();
    const bankName = (quote.bankName || '').toLowerCase();
    const remarks = (quote.remarks || '').toLowerCase();
    const interestRate = quote.interestRate?.toString().toLowerCase() || '';
    const status = (quote.status || '').toLowerCase();

    return (
      requirementId.includes(term) ||
      schemeName.includes(term) ||
      bankName.includes(term) ||
      remarks.includes(term) ||
      interestRate.includes(term) ||
      status.includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedQuotes = filteredQuotes.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!user || loading) {
    return <PageLoader />;
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const renderStatusBadge = (status?: string) => {
    const s = (status || 'submitted').toLowerCase();
    const label = s === 'selected' ? 'Accepted' : s === 'rejected' ? 'Rejected' : 'Pending';
    const cls = s === 'selected'
      ? 'bg-green-100 text-green-700'
      : s === 'rejected'
      ? 'bg-red-100 text-red-700'
      : 'bg-blue-100 text-blue-700';
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DepositNavigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Quotes</h1>
          <p className="text-gray-600 mt-2">View all your submitted quotes and rankings</p>
        </div>

        {quotes.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full lg:w-96">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by requirement ID, scheme, rate, status, or remarks"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="mt-4 text-gray-600">
              Showing {paginatedQuotes.length} of {filteredQuotes.length} matching quotes ({quotes.length} total)
            </div>
          </div>
        )}

        {quotes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Quotes Submitted</h3>
            <p className="text-gray-600 mb-6">You haven't submitted any quotes yet. Browse requirements and submit your best rates.</p>
            <button
              onClick={() => router.push('/bank/requirements')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              View Requirements
            </button>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a7 7 0 00-7 7c0 1.61.54 3.1 1.44 4.29L3 18l2.71-2.44A6.96 6.96 0 0011 18a7 7 0 100-14z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Matching Quotes</h3>
            <p className="text-gray-600 mb-6">No quotes match your current search.</p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedQuotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {quote.schemeName || requirementsMap.get(quote.requirementId) || 'Unknown Scheme'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">Requirement ID: {quote.requirementId}</p>
                    <p className="text-sm text-gray-500">
                      Submitted on {formatSubmittedAt(quote.submittedAt)}
                    </p>
                  </div>
                  <div>{renderStatusBadge(quote.status)}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Interest Rate Offered</p>
                    <p className="text-3xl font-bold text-blue-600">{quote.interestRate}%</p>
                  </div>
                  {quote.remarks && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Remarks</p>
                      <p className="text-gray-900">{quote.remarks}</p>
                    </div>
                  )}
                </div>

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
              </div>
            ))}
          </div>
        )}

        {filteredQuotes.length > 0 && totalPages > 1 && (
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
