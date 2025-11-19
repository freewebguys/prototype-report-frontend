import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

type Risk = {
  type: string
  filePath: string
  explanation: string
}

type ReportData = {
  structuralViabilityScore: number
  stage: string
  summary: string
  recommendedNextStep: string
  risks: Risk[]
}

const placeholderReport: ReportData = {
  structuralViabilityScore: 0,
  stage: 'Awaiting Analysis',
  summary: `Your app works today — but it won't let you grow safely.

This is the moment where prototypes either evolve... or break.

Your app works now, but it isn't built to survive real features, users, or growth.

It looks like a product — but it's still structured like a prototype.

The more you build on top of this structure (auth, teams, payments, workflows),
the more it begins to resist change.

You're not in trouble. You're just at the natural turning point —
where speed must start meeting structure.`,
  recommendedNextStep: `You don't need to start over.

But you do need to graduate.`,
  risks: [],
}

const stageDefinitions = [
  { stage: '🟢 Prototype', description: 'Fast to build, fragile to scale' },
  { stage: '🟡 Graduation Moment', description: 'Works now, but will break when you add real features' },
  { stage: '🔵 Product-Ready', description: 'Structured, modular, safe to evolve' },
]

type RiskTranslation = {
  label: string
  severity: string
  message: string
}

const translateRisk = (riskType: string): RiskTranslation => {
  const normalized = riskType.trim()
  
  switch (normalized) {
    case 'APICallInUI':
      return {
        label: 'Business logic mixed into UI',
        severity: '🔴 High Risk',
        message: 'Works for demos, but fragile when adding auth, workflows, or team features.',
      }
    case 'LogicInUI':
      return {
        label: 'Logic tangled inside components',
        severity: '🟠 Medium Risk',
        message: 'Hard to test, hard to change — every new feature increases risk.',
      }
    case 'FlatStructure':
      return {
        label: 'Prototype-only folder structure',
        severity: '🔴 Critical Risk',
        message: 'Everything lives in one folder — evolution will be painful.',
      }
    case 'HugeComponent':
      return {
        label: "Giant 'God' component",
        severity: '🟡 Medium-Low Risk',
        message: 'One file doing too many jobs — a sign of structural fragility.',
      }
    case 'CircularImport':
      return {
        label: 'Circular dependency risk',
        severity: '🔴 Critical Risk',
        message: 'Features begin to break randomly when files depend on each other in loops.',
      }
    default:
      return {
        label: riskType,
        severity: '⚪ Unknown Risk',
        message: 'Risk type not recognized — may indicate structural issues.',
      }
  }
}

const clampScore = (score: unknown): number => {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0
  if (!Number.isFinite(score)) return 0
  return Math.min(100, Math.max(0, Math.round(score)))
}

const normalizeString = (value: unknown, fallback = 'Not provided'): string => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return fallback
}

type RawRisk = Partial<Risk> & {
  file?: string
  filePath?: string
  why?: string
  whyItMatters?: string
  explanation?: string
}

const asRiskArray = (value: unknown): Risk[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const risk = item as RawRisk
      const type = normalizeString(risk.type, 'Not provided')
      const filePath = normalizeString(risk.file ?? risk.filePath, 'Not provided')
      const explanation = normalizeString(
        risk.why ?? risk.whyItMatters ?? risk.explanation,
        'Not provided',
      )
      return { type, filePath, explanation }
    })
    .filter((risk): risk is Risk => Boolean(risk))
}

const mapToReport = (raw: Partial<Record<keyof ReportData, unknown>> & { viabilityScore?: unknown }): ReportData => {
  const score = raw.structuralViabilityScore ?? raw.viabilityScore
  return {
    structuralViabilityScore: clampScore(score),
    stage: normalizeString(raw.stage, 'Not provided'),
    summary: normalizeString(raw.summary, placeholderReport.summary),
    recommendedNextStep: normalizeString(
      raw.recommendedNextStep ?? (raw as { nextStep?: string }).nextStep,
      placeholderReport.recommendedNextStep,
    ),
    risks: asRiskArray(raw.risks),
  }
}

export const ReportPage = () => {
  const [report, setReport] = useState<ReportData>(placeholderReport)
  const [isPlaceholder, setIsPlaceholder] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const text = reader.result
        if (typeof text !== 'string') {
          throw new Error('Unable to read file contents.')
        }

        const parsed = JSON.parse(text) as Partial<ReportData>
        const normalized = mapToReport(parsed)
        setReport(normalized)
        setIsPlaceholder(false)
        setFileName(file.name)
      } catch (err) {
        console.error(err)
        setError('We could not parse that file. Please confirm it is valid JSON.')
        setReport(placeholderReport)
        setIsPlaceholder(true)
        setFileName(null)
      } finally {
        event.target.value = ''
      }
    }

    reader.onerror = () => {
      console.error(reader.error)
      setError('Something went wrong while reading that file. Please try again.')
      event.target.value = ''
    }

    reader.readAsText(file)
  }

  const scoreWidth = useMemo(() => `${report.structuralViabilityScore}%`, [report.structuralViabilityScore])

  const getScoreTextColor = (score: number): string => {
    if (score >= 80) return 'text-[#11D1CB]'
    if (score >= 60) return 'text-[#2663EB]'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getRiskCardStyles = (severity: string): { bg: string; border: string; text: string; icon: string } => {
    if (severity.includes('🔴') && severity.includes('Critical')) {
      return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: '🚨' }
    }
    if (severity.includes('🔴')) {
      return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: '🚨' }
    }
    if (severity.includes('🟠')) {
      return { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', icon: '⚠️' }
    }
    if (severity.includes('🟡')) {
      return { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', icon: 'ℹ️' }
    }
    return { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800', icon: 'ℹ️' }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-10">
              <div className="text-xl font-light tracking-tight text-[#1E293B]">ArcSight<span className="text-[#2663EB]">.ai</span></div>
              <div className="hidden md:flex items-center gap-8">
                <a href="#" className="text-sm font-light text-[#1E293B] hover:text-[#2663EB] transition-colors">Report</a>
                <a href="#" className="text-sm font-light text-[#334155] hover:text-[#1E293B] transition-colors">Insights</a>
                <a href="#" className="text-sm font-light text-[#334155] hover:text-[#1E293B] transition-colors">History</a>
                <a href="#" className="text-sm font-light text-[#334155] hover:text-[#1E293B] transition-colors">Settings</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {fileName && (
                <span className="text-sm text-[#334155] hidden sm:inline font-light" aria-live="polite">
                  {fileName}
                </span>
              )}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2663EB] to-[#11D1CB] flex items-center justify-center shadow-sm">
                <span className="text-xs text-white font-light">U</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16 space-y-16 animate-fade-in">
        {/* Hero Section */}
        {isPlaceholder ? (
          <section className="relative text-center py-20 overflow-hidden">
            {/* Gradient Arc Background */}
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <div className="w-full max-w-4xl h-96 relative">
                <svg className="w-full h-full" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M 0 300 Q 200 100 400 150 T 800 200"
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    fill="none"
                    className="opacity-30"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2663EB" />
                      <stop offset="100%" stopColor="#11D1CB" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-light text-[#1E293B] mb-6 max-w-3xl mx-auto leading-tight">
                See your survival arc — before investors do
              </h1>
              <p className="text-lg text-[#334155] font-light leading-relaxed mb-12 max-w-2xl mx-auto">
                Clarity on your startup's future. Insight meets foresight for founders.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  className="bg-gradient-to-r from-[#2663EB] to-[#11D1CB] text-white rounded-xl px-8 py-3 font-light text-sm hover:shadow-lg transition-all duration-300 hover:scale-105"
                  onClick={handleUploadClick}
                >
                  Generate Report
                </button>
                <button
                  type="button"
                  className="border border-slate-300 bg-white text-[#334155] rounded-xl px-8 py-3 font-light text-sm hover:bg-slate-50 transition-all duration-300"
                  onClick={handleUploadClick}
                >
                  Try Demo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              {/* Preview Placeholders */}
              <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-6">
                  <div className="text-xs uppercase tracking-wider text-[#334155] font-light mb-3">ArcScore™</div>
                  <div className="text-3xl font-light text-[#1E293B] mb-2">—</div>
                  <div className="text-sm text-[#334155] font-light">Structural viability</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-6">
                  <div className="text-xs uppercase tracking-wider text-[#334155] font-light mb-3">RiskRadar™</div>
                  <div className="text-3xl font-light text-[#1E293B] mb-2">—</div>
                  <div className="text-sm text-[#334155] font-light">Risk dimensions</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-6">
                  <div className="text-xs uppercase tracking-wider text-[#334155] font-light mb-3">MomentumMap™</div>
                  <div className="text-3xl font-light text-[#1E293B] mb-2">—</div>
                  <div className="text-sm text-[#334155] font-light">Trajectory trend</div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-8 hover:shadow-lg transition-all duration-300">
            <div className="flex flex-wrap justify-between items-start gap-6">
              <div className="flex-1 max-w-prose">
                <p className="text-xs uppercase tracking-wider text-[#334155] font-light mb-2">ArcReport™</p>
                <h1 className="text-3xl font-light text-[#1E293B] mb-4 leading-tight">
                  Structural analysis complete
                </h1>
                <p className="text-base text-[#334155] font-light leading-relaxed mb-6">
                  Based on your product architecture and structural patterns, your viability trajectory shows {report.structuralViabilityScore < 60 ? 'elevated risk' : report.structuralViabilityScore < 80 ? 'moderate stability' : 'strong foundation'}.
                </p>
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#2663EB]/10 to-[#11D1CB]/10 border border-[#2663EB]/20 text-[#1E293B] text-sm font-light">
                  ArcScore™: {report.structuralViabilityScore}% — {report.stage}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="bg-gradient-to-r from-[#2663EB] to-[#11D1CB] text-white rounded-xl px-6 py-2.5 font-light text-sm hover:shadow-lg transition-all duration-300"
                  onClick={handleUploadClick}
                >
                  New Scan
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </section>
        )}

        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-400 rounded-xl shadow-md p-4 text-red-800 font-light" role="alert">
            {error}
          </div>
        )}

        {/* ArcScore™ Component */}
        <section>
          <h2 className="text-2xl font-light text-[#1E293B] mb-8">
            ArcScore™
          </h2>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-8 hover:shadow-lg transition-all duration-300">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Circular Progress Ring */}
              <div className="relative w-48 h-48 flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - report.structuralViabilityScore / 100)}`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2663EB" />
                      <stop offset="100%" stopColor="#11D1CB" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className={`text-4xl font-light ${getScoreTextColor(report.structuralViabilityScore)}`}>
                      {report.structuralViabilityScore}
                    </div>
                    <div className="text-xs text-[#334155] font-light uppercase tracking-wider mt-1">Score</div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <p className="text-sm uppercase tracking-wider text-[#334155] font-light mb-3">Structural Viability</p>
                <p className="text-base text-[#334155] font-light leading-relaxed mb-4">
                  {isPlaceholder
                    ? 'Score will appear after you load a report.'
                    : `Your architecture shows ${report.structuralViabilityScore >= 80 ? 'strong structural integrity' : report.structuralViabilityScore >= 60 ? 'moderate stability with room for improvement' : 'elevated structural risk'}. ${report.structuralViabilityScore >= 60 ? 'Foundation supports growth trajectory.' : 'Consider structural refactoring before scaling.'}`}
                </p>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2663EB] to-[#11D1CB] rounded-full transition-all duration-1000"
                    style={{ width: scoreWidth }}
                  />
                </div>
              </div>
            </div>
          </div>

          {!isPlaceholder && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-8 hover:shadow-lg transition-all duration-300 mt-8">
              <h3 className="text-xl font-light text-[#1E293B] mb-6">
                Feature Collapse Forecast
              </h3>
              <div className="text-base text-[#334155] font-light leading-relaxed max-w-prose">
                <p className="mb-6">
                  Adding these features will increase structural risk:
                </p>
                <ul className="space-y-4 list-none pl-0">
                  <li className="flex items-start gap-3">
                    <span className="text-[#2663EB]">🔐</span>
                    <div>
                      <strong className="font-light text-[#1E293B]">Authentication</strong>
                      <span className="text-[#334155]"> — Duplicated logic and inconsistent access patterns</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#2663EB]">💳</span>
                    <div>
                      <strong className="font-light text-[#1E293B]">Payments</strong>
                      <span className="text-[#334155]"> — Fragile workflows and untrackable bugs</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#2663EB]">👥</span>
                    <div>
                      <strong className="font-light text-[#1E293B]">Teams & roles</strong>
                      <span className="text-[#334155]"> — Tightly coupled files and conflicts</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#2663EB]">📊</span>
                    <div>
                      <strong className="font-light text-[#1E293B]">Dashboards / workflows</strong>
                      <span className="text-[#334155]"> — High risk of structural failure</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* RiskRadar™ Section */}
        <section>
          <h2 className="text-2xl font-light text-[#1E293B] mb-8">
            RiskRadar™
          </h2>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-8 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm uppercase tracking-wider text-[#334155] font-light">Detected Risks</h3>
              <span className="px-4 py-1.5 rounded-full bg-slate-100 text-[#1E293B] text-sm font-light shadow-sm">
                {report.risks.length} items
              </span>
            </div>
            <p className="text-base text-[#334155] font-light leading-relaxed mb-8 max-w-prose">
              Structural areas that increase complexity and risk for future feature development.
            </p>
            {report.risks.length === 0 ? (
              <p className="text-gray-500">No risks listed yet.</p>
            ) : (
              <div className="space-y-4">
                {report.risks.map((risk, index) => {
                  const translated = translateRisk(risk.type)
                  const cardStyles = getRiskCardStyles(translated.severity)
                  return (
                    <div
                      key={`${risk.filePath}-${index}`}
                      className={`border-l-4 rounded-md shadow-sm p-4 mb-4 ${cardStyles.bg} ${cardStyles.border} ${cardStyles.text}`}
                    >
                      <div className="font-semibold mb-2 flex items-center gap-2">
                        <span>{cardStyles.icon}</span>
                        <span>{translated.severity} — {translated.label}</span>
                      </div>
                      <div className="text-sm mb-2">
                        <span className="font-mono text-sm bg-slate-100 text-[#2663EB] px-2 py-1 rounded cursor-pointer hover:bg-slate-200 transition-colors">
                          <a
                            href="#"
                            onClick={(evt) => evt.preventDefault()}
                            className="hover:underline"
                          >
                            {risk.filePath}
                          </a>
                        </span>
                      </div>
                      <div className="text-sm mb-2 leading-relaxed">
                        {risk.explanation}
                      </div>
                      <div className="text-sm leading-relaxed opacity-90">
                        {translated.message}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* MomentumMap™ Section */}
        {!isPlaceholder && (
          <section>
            <h2 className="text-2xl font-light text-[#1E293B] mb-8">
              MomentumMap™
            </h2>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-8 hover:shadow-lg transition-all duration-300">
              <div className="text-base text-[#334155] font-light leading-relaxed max-w-prose">
                <p className="mb-6">
                  Based on structural analysis, these areas show highest failure probability:
                </p>
                <ul className="space-y-4 list-none pl-0">
                  {report.risks.length > 0 ? (
                    report.risks.slice(0, 5).map((risk, index) => {
                      const translated = translateRisk(risk.type)
                      return (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-[#2663EB]">{translated.severity.includes('🔴') ? '🚨' : translated.severity.includes('🟠') ? '⚠️' : 'ℹ️'}</span>
                          <div>
                            <strong className="font-light text-[#1E293B]">{translated.label}</strong>
                            <span className="text-sm text-[#334155]">
                              {' '}in <span className="font-mono text-sm bg-slate-100 text-[#2663EB] px-2 py-1 rounded">{risk.filePath}</span> — {translated.message}
                            </span>
                          </div>
                        </li>
                      )
                    })
                  ) : (
                    <>
                      <li className="flex items-start gap-3">
                        <span className="text-[#2663EB]">🔐</span>
                        <span className="text-[#334155]">Authentication — duplicated logic and inconsistent access</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#2663EB]">💳</span>
                        <span className="text-[#334155]">Payments — fragile workflows and untrackable bugs</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#2663EB]">👥</span>
                        <span className="text-[#334155]">Teams & roles — tightly coupled files and conflicts</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-[#2663EB]">📊</span>
                        <span className="text-[#334155]">Dashboards / workflows — high risk of structural failure</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Growth Stage Analysis */}
        {!isPlaceholder && (
          <section>
            <h2 className="text-2xl font-light text-[#1E293B] mb-8">
              Growth Stage Analysis
            </h2>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-8 hover:shadow-lg transition-all duration-300">
              <div className="flex gap-3 mb-6 flex-wrap">
                {stageDefinitions.map((def, index) => {
                  const isCurrent = report.stage === 'Graduation Moment' || report.stage.includes('Graduation')
                  const isActive = (isCurrent && index === 1) || (!isCurrent && index === 0)
                  return (
                    <span
                      key={def.stage}
                      className={`px-4 py-2 rounded-full text-sm font-light shadow-sm ${
                        index === 0 ? 'bg-green-50 text-green-700 border border-green-200' :
                        index === 1 ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      } ${isActive ? 'ring-2 ring-[#2663EB]' : ''}`}
                    >
                      {def.stage}
                    </span>
                  )
                })}
              </div>
              <div className="space-y-4 mb-6">
                {stageDefinitions.map((def) => (
                  <div key={def.stage} className="flex items-start">
                    <span className="font-light text-[#1E293B] min-w-[220px]">{def.stage}</span>
                    <span className="text-base text-[#334155] font-light leading-relaxed">{def.description}</span>
                  </div>
                ))}
              </div>
              <p className="text-base text-[#334155] font-light leading-relaxed pt-4 border-t border-slate-200">
                {report.stage === 'Graduation Moment' || report.stage.includes('Graduation') ? (
                  <>Current position: Graduation Moment — structural transition required before scaling</>
                ) : (
                  <>Current stage: {report.stage}</>
                )}
              </p>
            </div>
          </section>
        )}

        {/* Strategic Insights */}
        {!isPlaceholder && (
          <section>
            <h2 className="text-2xl font-light text-[#1E293B] mb-8">
              Strategic Insights
            </h2>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-8 hover:shadow-lg transition-all duration-300">
              <div className="text-base text-[#334155] font-light leading-relaxed max-w-prose space-y-4">
                <p>
                  Your product architecture shows prototype-level structure — functional for initial development, but requiring structural evolution before scaling.
                </p>
                <p>
                  Prototype architecture consolidates UI, logic, and data in a single layer. This accelerates initial development but increases complexity risk when adding production features.
                </p>
                <p>
                  This is a structural milestone, not a defect. Transition planning is recommended before scaling operations.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Recommendations */}
        <section>
          <h2 className="text-2xl font-light text-[#1E293B] mb-8">
            Recommendations
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-8 hover:shadow-lg transition-all duration-300">
              <h3 className="text-sm uppercase tracking-wider text-[#334155] font-light mb-6">Summary</h3>
              <div className="text-base text-[#334155] font-light leading-relaxed space-y-4 max-w-prose">
                {report.summary.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </article>
            <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-slate-200/50 p-8 hover:shadow-lg transition-all duration-300">
              <h3 className="text-sm uppercase tracking-wider text-[#334155] font-light mb-6">Action Plan</h3>
              <div className="text-base text-[#334155] font-light leading-relaxed max-w-prose">
                <p className="font-light text-[#1E293B] mb-4">
                  Priority Actions by Goal
                </p>
                <ul className="space-y-3 list-none pl-0 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#11D1CB]">✔</span>
                    <span>Demo or pitch → Current structure sufficient</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">⚠</span>
                    <span>Building production features → Begin UI/logic separation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">🚨</span>
                    <span>Adding payments, roles, workflows → Restructure first</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">🚨</span>
                    <span>Hiring engineers or scaling → Establish foundation now</span>
                  </li>
                </ul>
                <p className="font-light text-[#1E293B] mt-6 pt-6 border-t border-slate-200">
                  {report.recommendedNextStep.split('\n').map((line, index) => (
                    <span key={index}>
                      {line}
                      {index < report.recommendedNextStep.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ReportPage

