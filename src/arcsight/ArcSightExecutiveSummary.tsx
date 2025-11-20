import React, { useMemo } from 'react'

interface Insight {
  id: number
  title: string
  severity: 'high' | 'medium' | 'low'
  summary: string
  files?: string[]
  recommendation?: string
}

interface ExecutiveSummaryProps {
  insights: Insight[]
}

const ArcSightExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ insights }) => {
  const analysis = useMemo(() => {
    const counts = {
      high: insights.filter((i) => i.severity === 'high').length,
      medium: insights.filter((i) => i.severity === 'medium').length,
      low: insights.filter((i) => i.severity === 'low').length,
    }

    const total = insights.length
    const hasHighRisk = counts.high > 0

    // Detect patterns from titles
    const hasDatabaseRisk = insights.some(
      (i) =>
        i.title.toLowerCase().includes('database') ||
        i.title.toLowerCase().includes('shared') ||
        i.title.toLowerCase().includes('schema'),
    )

    const hasBottleneck = insights.some(
      (i) =>
        i.title.toLowerCase().includes('auth') ||
        i.title.toLowerCase().includes('identity') ||
        i.title.toLowerCase().includes('bottleneck') ||
        i.title.toLowerCase().includes('god'),
    )

    const hasExternalDependency = insights.some(
      (i) =>
        i.title.toLowerCase().includes('stripe') ||
        i.title.toLowerCase().includes('3rd party') ||
        i.title.toLowerCase().includes('external') ||
        i.title.toLowerCase().includes('integration'),
    )

    const hasCrossDomain = insights.some(
      (i) =>
        i.title.toLowerCase().includes('cross-domain') ||
        i.title.toLowerCase().includes('coupling') ||
        i.title.toLowerCase().includes('domain'),
    )

    // Extract top fragility signals
    const topFragilities = insights
      .filter((i) => i.severity === 'high' || i.severity === 'medium')
      .slice(0, 3)
      .map((i) => {
        let signal = ''
        if (i.title.toLowerCase().includes('database') || i.title.toLowerCase().includes('shared')) {
          signal = 'Shared Database Risk'
        } else if (
          i.title.toLowerCase().includes('auth') ||
          i.title.toLowerCase().includes('bottleneck')
        ) {
          signal = 'Structural Bottleneck'
        } else if (i.title.toLowerCase().includes('stripe') || i.title.toLowerCase().includes('integration')) {
          signal = 'External API Blast Radius'
        } else if (i.title.toLowerCase().includes('cross-domain') || i.title.toLowerCase().includes('coupling')) {
          signal = 'Cross-Domain Coupling'
        } else {
          signal = i.title
        }
        return { signal, summary: i.summary }
      })

    // Generate narrative
    const severityText = []
    if (counts.high > 0) severityText.push(`${counts.high} High-Severity`)
    if (counts.medium > 0) severityText.push(`${counts.medium} Moderate`)
    if (counts.low > 0) severityText.push(`${counts.low} Low-Severity`)

    const riskText = severityText.join(' and ') + (total > 1 ? ' risks' : ' risk')

    let narrative = `ArcSight detected ${riskText} that could impact architectural stability, migration feasibility, and long-term roadmap agility.`

    if (hasHighRisk) {
      narrative += ' These structural fragilities can lead to:'
    }

    return {
      counts,
      total,
      hasHighRisk,
      hasDatabaseRisk,
      hasBottleneck,
      hasExternalDependency,
      hasCrossDomain,
      topFragilities,
      narrative,
    }
  }, [insights])

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-6 border border-slate-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-medium text-[#0E1116] mb-3 flex items-center gap-2">
          <span>🔎</span> ArcSight Structural Summary
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[#1F2328] font-medium">Stats:</span>
          {analysis.counts.high > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
              {analysis.counts.high} High
            </span>
          )}
          {analysis.counts.medium > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-400 text-black">
              {analysis.counts.medium} Medium
            </span>
          )}
          {analysis.counts.low > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
              {analysis.counts.low} Low
            </span>
          )}
        </div>
      </div>

      {/* Narrative Block */}
      <div className="mb-6">
        <p className="text-base text-[#1F2328] leading-relaxed mb-4">{analysis.narrative}</p>

        {analysis.hasHighRisk && (
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-sm text-red-600 font-medium">🚨 Hard migrations ahead</span>
            <span className="text-sm text-red-600 font-medium">🚨 Feature freeze risk</span>
            {analysis.hasDatabaseRisk && (
              <span className="text-sm text-red-600 font-medium">🚨 Configuration blast radius</span>
            )}
          </div>
        )}
      </div>

      {/* Top Fragility Signals */}
      {analysis.topFragilities.length > 0 && (
        <div className="pt-6 border-t border-slate-200">
          <h3 className="text-sm font-medium text-[#0E1116] uppercase tracking-wide mb-4">
            Top Structural Fragility Signals Detected
          </h3>
          <ul className="space-y-3">
            {analysis.topFragilities.map((fragility, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-[#3A7BFF] mt-0.5">•</span>
                <div className="flex-1">
                  <span className="font-medium text-[#0E1116]">{fragility.signal}</span>
                  <span className="text-[#1F2328]"> — {fragility.summary}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ArcSightExecutiveSummary

