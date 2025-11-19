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
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
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
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Sticky Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="text-xl font-semibold text-[#1F2328]">ArcSight</div>
              <div className="hidden md:flex items-center gap-6">
                <a href="#" className="text-sm font-medium text-[#1F2328] hover:text-[#3A7BFF] transition">Report</a>
                <a href="#" className="text-sm font-medium text-[#6B7280] hover:text-[#1F2328] transition">Scan History</a>
                <a href="#" className="text-sm font-medium text-[#6B7280] hover:text-[#1F2328] transition">Migration Map <span className="text-xs text-[#6B7280]">(Coming Soon)</span></a>
                <a href="#" className="text-sm font-medium text-[#6B7280] hover:text-[#1F2328] transition">Settings</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {fileName && (
                <span className="text-sm text-[#6B7280] hidden sm:inline" aria-live="polite">
                  {fileName}
                </span>
              )}
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-600">U</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
        {/* Hero Section */}
        {isPlaceholder ? (
          <section className="text-center py-16">
            <h1 className="text-2xl font-semibold text-[#1F2328] mb-4 max-w-2xl mx-auto">
              Can your AI-built prototype survive real growth?
            </h1>
            <p className="text-[15px] text-[#6B7280] leading-relaxed mb-8 max-w-xl mx-auto">
              ArcSight scans your architecture, detects structural weak points, and reveals whether your prototype can scale — or collapse.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                className="bg-[#3A7BFF] text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-600 transition"
                onClick={handleUploadClick}
              >
                Run ArcSight Scan
              </button>
              <button
                type="button"
                className="border border-gray-300 bg-white text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-50 transition"
                onClick={handleUploadClick}
              >
                Try Sample Report
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-xl shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="flex-1 max-w-prose">
                <p className="text-xs uppercase tracking-wide text-[#6B7280] mb-1">Prototype Survival Report</p>
                <h1 className="text-2xl font-semibold text-[#1F2328] mb-3 leading-tight">
                  Your app works today — but it won't let you grow safely.
                </h1>
                <p className="text-[15px] text-[#6B7280] leading-relaxed">
                  This is the moment where prototypes either evolve... or break.
                </p>
                <p className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium shadow-sm mt-4">
                  Structural Viability Score: {report.structuralViabilityScore}% — {report.stage}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="bg-[#3A7BFF] text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-600 transition"
                  onClick={handleUploadClick}
                >
                  Upload JSON
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
          <div className="bg-red-50 border-l-4 border-red-300 rounded-md shadow-sm p-4 text-red-800" role="alert">
            {error}
          </div>
        )}

        {/* 📊 Structural Snapshot */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1F2328] mb-6">
            Structural Snapshot
          </h2>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-baseline mb-3">
              <p className="text-sm uppercase tracking-wide text-[#6B7280] mb-1">Structural Viability Score</p>
              <div className={`text-4xl font-bold ${getScoreTextColor(report.structuralViabilityScore)}`}>
                {report.structuralViabilityScore}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-[#3A7BFF] to-blue-600 rounded-full transition-all duration-500"
                style={{ width: scoreWidth }}
              />
            </div>
            <p className="text-[15px] text-[#6B7280] leading-relaxed">
              {isPlaceholder
                ? 'Score will appear after you load a report.'
                : 'Higher scores mean your app can grow without breaking.'}
            </p>
          </div>

          {!isPlaceholder && (
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow mt-6">
              <h3 className="text-xl font-semibold text-[#1F2328] mb-4">
                Feature Collapse Forecast
              </h3>
              <div className="text-[15px] text-[#6B7280] leading-relaxed max-w-prose">
                <p className="mb-4">
                  If you try to add features like:
                </p>
                <ul className="space-y-3 list-none pl-0">
                  <li className="flex items-start">
                    <strong className="font-semibold text-[#1F2328] mr-2">🔐 Authentication</strong>
                    <span>→ duplicated logic and inconsistent access</span>
                  </li>
                  <li className="flex items-start">
                    <strong className="font-semibold text-[#1F2328] mr-2">💳 Payments</strong>
                    <span>→ fragile workflows and untrackable bugs</span>
                  </li>
                  <li className="flex items-start">
                    <strong className="font-semibold text-[#1F2328] mr-2">👥 Teams & roles</strong>
                    <span>→ tightly coupled files and conflicts</span>
                  </li>
                  <li className="flex items-start">
                    <strong className="font-semibold text-[#1F2328] mr-2">📊 Dashboards / workflows</strong>
                    <span>→ high risk of structural failure</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* 🛑 Key Fragility Risks */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1F2328] mb-6">
            Key Fragility Risks
          </h2>
          
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm uppercase tracking-wide text-[#6B7280]">Detected Risks</h3>
              <span className="px-3 py-1 rounded-full bg-gray-200 text-[#1F2328] text-sm font-medium shadow-sm">
                {report.risks.length} items
              </span>
            </div>
            <p className="text-[15px] text-[#6B7280] leading-relaxed mb-6 max-w-prose">
              These are areas that will make future features harder and riskier to build.
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
                        <span className="font-mono text-sm bg-gray-100 text-[#3A7BFF] px-2 py-1 rounded cursor-pointer hover:bg-gray-200">
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

        {/* 💥 What Will Break First */}
        {!isPlaceholder && (
          <section>
            <h2 className="text-2xl font-semibold text-[#1F2328] mb-6">
              What Will Break First
            </h2>
            
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-[15px] text-[#6B7280] leading-relaxed max-w-prose">
                <p className="mb-4">
                  Based on your current structure, these are the most likely breaking points:
                </p>
                <ul className="space-y-3 list-none pl-0">
                  {report.risks.length > 0 ? (
                    report.risks.slice(0, 5).map((risk, index) => {
                      const translated = translateRisk(risk.type)
                      return (
                        <li key={index} className="flex items-start">
                          <strong className="font-semibold text-[#1F2328] mr-2">{translated.severity} {translated.label}</strong>
                          <span className="text-sm">
                            in <span className="font-mono text-sm bg-gray-100 text-[#3A7BFF] px-2 py-1 rounded cursor-pointer hover:bg-gray-200">{risk.filePath}</span> — {translated.message}
                          </span>
                        </li>
                      )
                    })
                  ) : (
                    <>
                      <li className="flex items-start">
                        <strong className="font-semibold text-[#1F2328] mr-2">🔐 Authentication</strong>
                        <span>— duplicated logic and inconsistent access</span>
                      </li>
                      <li className="flex items-start">
                        <strong className="font-semibold text-[#1F2328] mr-2">💳 Payments</strong>
                        <span>— fragile workflows and untrackable bugs</span>
                      </li>
                      <li className="flex items-start">
                        <strong className="font-semibold text-[#1F2328] mr-2">👥 Teams & roles</strong>
                        <span>— tightly coupled files and conflicts</span>
                      </li>
                      <li className="flex items-start">
                        <strong className="font-semibold text-[#1F2328] mr-2">📊 Dashboards / workflows</strong>
                        <span>— high risk of structural failure</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* 🧭 Growth Stage — Where You Are */}
        {!isPlaceholder && (
          <section>
            <h2 className="text-2xl font-semibold text-[#1F2328] mb-6">
              Growth Stage — Where You Are
            </h2>
            
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex gap-3 mt-4 flex-wrap">
                {stageDefinitions.map((def, index) => {
                  const isCurrent = report.stage === 'Graduation Moment' || report.stage.includes('Graduation')
                  const isActive = (isCurrent && index === 1) || (!isCurrent && index === 0)
                  return (
                    <span
                      key={def.stage}
                      className={`px-3 py-1 rounded-full text-sm font-medium shadow-sm ${
                        index === 0 ? 'bg-green-100 text-green-700' :
                        index === 1 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      } ${isActive ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      {def.stage}
                    </span>
                  )
                })}
              </div>
              <div className="mt-6 space-y-3">
                {stageDefinitions.map((def) => (
                  <div key={def.stage} className="flex items-start">
                    <span className="font-medium text-[#1F2328] min-w-[200px]">{def.stage}</span>
                    <span className="text-[15px] text-[#6B7280] leading-relaxed">{def.description}</span>
                  </div>
                ))}
              </div>
              <p className="text-[15px] text-[#6B7280] leading-relaxed mt-4">
                {report.stage === 'Graduation Moment' || report.stage.includes('Graduation') ? (
                  <>🟡 Graduation Moment ← You are here</>
                ) : (
                  <>Current stage: {report.stage}</>
                )}
              </p>
            </div>
          </section>
        )}

        {/* 💡 Founder-Friendly Explanation */}
        {!isPlaceholder && (
          <section>
            <h2 className="text-2xl font-semibold text-[#1F2328] mb-6">
              Founder-Friendly Explanation
            </h2>
            
            <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="text-[15px] text-[#6B7280] leading-relaxed max-w-prose space-y-3">
                <p>
                  Your app looks like a product — but it's still built like a prototype.
                </p>
                <p>
                  In prototypes, UI, logic, and data all live in one layer. That's perfect for speed,
                  but it becomes painful when adding real-world complexity.
                </p>
                <p>
                  This isn't a coding bug. It's a structure milestone.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 🚦 What To Do Next */}
        <section>
          <h2 className="text-2xl font-semibold text-[#1F2328] mb-6">
            What To Do Next
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <article className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <h3 className="text-sm uppercase tracking-wide text-[#6B7280] mb-4">Summary</h3>
              <div className="text-[15px] text-[#6B7280] leading-relaxed space-y-3 max-w-prose">
                {report.summary.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </article>
            <article className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <h3 className="text-sm uppercase tracking-wide text-[#6B7280] mb-4">Recommendation</h3>
              <div className="text-[15px] text-[#6B7280] leading-relaxed max-w-prose">
                <p className="font-semibold text-[#1F2328] mb-3">
                  Goal — Recommendation
                </p>
                <ul className="space-y-2 list-none pl-0 mb-4">
                  <li>✔ Demo or pitch → You can stay as you are</li>
                  <li>⚠ Start building real features → Begin separating UI from logic</li>
                  <li>🚨 Add payments, roles, workflows → Restructure before building</li>
                  <li>🚨 Hire engineers or scale product → Create a stronger foundation now</li>
                </ul>
                <p className="font-medium text-[#1F2328] mt-4">
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

