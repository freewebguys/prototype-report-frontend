import React, { useState, useMemo } from 'react'
import ArcSightInsightCard from './ArcSightInsightCard'

interface Insight {
  id: number
  title: string
  severity: 'high' | 'medium' | 'low'
  summary: string
  files: string[]
  recommendation: string
}

type FilterType = 'All' | 'High' | 'Medium' | 'Low'

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

const ArcSightDashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All')

  const normalizeSeverity = (severity: string): 'High' | 'Medium' | 'Low' => {
    const normalized = severity.toLowerCase()
    if (normalized === 'high') return 'High'
    if (normalized === 'medium') return 'Medium'
    return 'Low'
  }

  const filteredInsights = useMemo(() => {
    if (activeFilter === 'All') return insights
    return insights.filter(
      (insight) => insight.severity.toLowerCase() === activeFilter.toLowerCase(),
    )
  }, [activeFilter])

  const groupedInsights = useMemo(() => {
    const high: Insight[] = []
    const medium: Insight[] = []
    const low: Insight[] = []

    filteredInsights.forEach((insight) => {
      if (insight.severity === 'high') high.push(insight)
      else if (insight.severity === 'medium') medium.push(insight)
      else low.push(insight)
    })

    return { high, medium, low }
  }, [filteredInsights])

  const filterButtons: FilterType[] = ['All', 'High', 'Medium', 'Low']

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-6xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-medium text-[#0E1116] mb-2">
            ArcSight Architecture Fragility Report
          </h1>
          <p className="text-base text-[#1F2328]">
            Structural Risk Insights extracted from your architecture scan.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          {filterButtons.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeFilter === filter
                  ? 'bg-[#3A7BFF] text-white shadow-sm'
                  : 'bg-white text-[#1F2328] border border-gray-200 hover:border-gray-300'
              }`}
            >
              {filter === 'All' ? 'All' : `${filter} Risk`}
            </button>
          ))}
        </div>

        {/* High-Risk Findings */}
        {groupedInsights.high.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-medium text-[#0E1116] mb-6 flex items-center gap-2">
              <span>🔴</span> High-Risk Findings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedInsights.high.map((insight) => (
                <ArcSightInsightCard
                  key={insight.id}
                  title={insight.title}
                  severity={normalizeSeverity(insight.severity)}
                  description={insight.summary}
                  affectedFiles={insight.files}
                  whyItMatters={insight.recommendation}
                />
              ))}
            </div>
          </section>
        )}

        {/* Medium-Risk Findings */}
        {groupedInsights.medium.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-medium text-[#0E1116] mb-6 flex items-center gap-2">
              <span>🟠</span> Medium-Risk Findings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedInsights.medium.map((insight) => (
                <ArcSightInsightCard
                  key={insight.id}
                  title={insight.title}
                  severity={normalizeSeverity(insight.severity)}
                  description={insight.summary}
                  affectedFiles={insight.files}
                  whyItMatters={insight.recommendation}
                />
              ))}
            </div>
          </section>
        )}

        {/* Low-Risk Observations */}
        {groupedInsights.low.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-medium text-[#0E1116] mb-6 flex items-center gap-2">
              <span>🟢</span> Low-Risk Observations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupedInsights.low.map((insight) => (
                <ArcSightInsightCard
                  key={insight.id}
                  title={insight.title}
                  severity={normalizeSeverity(insight.severity)}
                  description={insight.summary}
                  affectedFiles={insight.files}
                  whyItMatters={insight.recommendation}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredInsights.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#1F2328] text-base">No insights found for the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ArcSightDashboard

