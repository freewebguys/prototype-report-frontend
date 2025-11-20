import React, { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import ArcSightDashboard from './ArcSightDashboard'
import ArcSightExecutiveSummary from './ArcSightExecutiveSummary'

interface Insight {
  id: number
  title: string
  severity: 'high' | 'medium' | 'low'
  summary: string
  files: string[]
  recommendation: string
}

const insights: Insight[] = [
  {
    id: 1,
    title: 'Shared Database Fragility',
    severity: 'high',
    summary:
      'Multiple services (auth, billing, subscriptions) are writing to the same Supabase Postgres schema.',
    files: ['schema.sql', 'types_db.ts', 'utils/supabase/client.ts'],
    recommendation:
      'Consider isolating user, billing, and subscription data into separate bounded contexts or schemas.',
  },
  {
    id: 2,
    title: 'Auth Service as Structural Bottleneck',
    severity: 'high',
    summary:
      'auth-service handles both identity AND billing verification — tightly coupling 2 business domains.',
    files: ['utils/auth-helpers/server.ts', 'app/api/billing/route.ts'],
    recommendation:
      'Refactor billing verification logic into a decoupled BillingAccess service.',
  },
  {
    id: 3,
    title: 'Stripe Integration Blast Radius',
    severity: 'medium',
    summary:
      'Stripe API is directly called from 4 modules including auth, billing, and webhooks — increasing deployment risk.',
    files: ['utils/stripe/server.ts', 'app/api/webhooks/route.ts'],
    recommendation: 'Introduce an internal payments adapter to encapsulate Stripe calls.',
  },
  {
    id: 4,
    title: 'Cross-Domain Database Write Fragility',
    severity: 'high',
    summary:
      'Authentication, Billing, and Subscription domains are all directly writing to the same `users` table — creating structural coupling and future migration and compliance risk.',
    files: [
      'utils/auth-helpers/server.ts',
      'utils/stripe/server.ts',
      'app/api/webhooks/route.ts',
    ],
    recommendation: `Multiple domains (Auth, Billing, Subscription) directly write to the same \`users\` table. 

This creates hidden structural coupling and leads to:
• Schema lock: one schema change affects multiple services
• Migration friction: cannot isolate billing or auth without major rewrite
• Compliance risk: billing code touches identity and PII data

This is not a bug — it's a structural architecture fragility.

Stop direct cross-domain writes into the \`users\` table. 

Introduce a BillingProfile or SubscriptionState model. 

Gradually isolate authentication from billing logic using API or service boundaries.`,
  },
]

const ArcSightReportPage: React.FC = () => {
  const reportRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: 'ArcSight Architecture Fragility Report',
  })

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div>
            <div className="text-2xl font-semibold tracking-tight text-slate-900">ArcSight</div>
            <div className="text-xs text-slate-600 mt-0.5">Architecture Intelligence</div>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3A7BFF] text-white px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>
        </div>

        {/* Printable Report Area */}
        <div ref={reportRef} className="bg-white rounded-xl shadow-sm p-8 print:shadow-none print:rounded-none">
          {/* Report Header */}
          <div className="mb-10 pb-8 border-b border-slate-200">
            <h1 className="text-3xl font-medium text-[#0E1116] mb-2">
              ArcSight Architecture Fragility Report
            </h1>
            <p className="text-base text-[#1F2328] mb-6">
              Structural risk insights extracted from your latest architecture scan.
            </p>
            <div className="flex flex-wrap gap-6 text-sm text-[#1F2328]">
              <div>
                <span className="font-medium">System:</span>{' '}
                <span className="text-slate-600">subscription-payments-nextjs</span>
              </div>
              <div>
                <span className="font-medium">Generated:</span>{' '}
                <span className="text-slate-600">{currentDate}</span>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <ArcSightExecutiveSummary insights={insights} />

          {/* Dashboard Content */}
          <div className="print:bg-white">
            <ArcSightDashboard />
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
        }
      `}</style>
    </div>
  )
}

export default ArcSightReportPage

// Usage example (e.g. in App.tsx):
// import ArcSightReportPage from './arcsight/ArcSightReportPage'
// <ArcSightReportPage />

