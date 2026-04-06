import { NextRequest } from 'next/server';
import { proxyRequest } from '../helper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric') || '';

  const metricMap: Record<string, string> = {
    'enhanced-kpis': 'enhanced-kpis',
    'bank-wise': 'bank-wise-analytics',
    'upcoming-maturities': 'upcoming-maturities',
    'deposit-type-distribution': 'deposit-type-distribution',
    timeline: 'interest-timeline',
    'portfolio-health': 'portfolio-health',
  };

  const mappedMetric = metricMap[metric];
  if (!mappedMetric) {
    return Response.json(
      {
        Success: false,
        Message: `Unknown commissioner dashboard metric: ${metric}`,
        Data: null,
      },
      { status: 400 }
    );
  }

  const query = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== 'metric') {
      query.append(key, value);
    }
  });

  const apiPath = `/api/deposits/commissioner/dashboard/${mappedMetric}${query.toString() ? `?${query.toString()}` : ''}`;
  return proxyRequest(request, apiPath, 'GET');
}
