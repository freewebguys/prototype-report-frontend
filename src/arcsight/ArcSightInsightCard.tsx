import React from 'react'

interface InsightCardProps {
  title: string
  severity: 'High' | 'Medium' | 'Low'
  description: string
  affectedFiles?: string[]
  whyItMatters?: string
}

const ArcSightInsightCard: React.FC<InsightCardProps> = ({
  title,
  severity,
  description,
  affectedFiles = [],
  whyItMatters,
}) => {
  const getSeverityStyles = (severity: 'High' | 'Medium' | 'Low') => {
    switch (severity) {
      case 'High':
        return 'bg-red-500 text-white'
      case 'Medium':
        return 'bg-yellow-400 text-black'
      case 'Low':
        return 'bg-green-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100">
      {/* Header with Title and Severity Badge */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="text-lg font-medium text-[#0E1116] flex-1">{title}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getSeverityStyles(severity)} whitespace-nowrap`}
        >
          {severity} Risk
        </span>
      </div>

      {/* Description */}
      <p className="text-[#1F2328] text-sm leading-relaxed mb-5">{description}</p>

      {/* Affected Files Section */}
      {affectedFiles && affectedFiles.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-medium text-[#1F2328] uppercase tracking-wide mb-2">
            Affected Files
          </h4>
          <ul className="space-y-1">
            {affectedFiles.map((file, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-[#3A7BFF] mt-0.5">•</span>
                <code className="text-xs text-[#1F2328] font-mono bg-[#F5F6F7] px-2 py-1 rounded flex-1 break-all">
                  {file}
                </code>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Why It Matters Section */}
      {whyItMatters && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-xs font-medium text-[#1F2328] uppercase tracking-wide mb-2">
            Why It Matters
          </h4>
          <p className="text-sm text-[#1F2328] leading-relaxed">{whyItMatters}</p>
        </div>
      )}
    </div>
  )
}

export default ArcSightInsightCard

/* 
Example Usage:

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <ArcSightInsightCard
    title="Shared Database Risk"
    severity="High"
    description="Multiple services depend on a single database instance without proper connection pooling or failover mechanisms. This creates a critical bottleneck and single point of failure."
    affectedFiles={[
      "/src/services/userService.ts",
      "/src/services/orderService.ts",
      "/src/services/paymentService.ts"
    ]}
    whyItMatters="If the database goes down, all dependent services fail simultaneously. Scaling becomes difficult as all services compete for the same database resources."
  />

  <ArcSightInsightCard
    title="Single Point of Failure (God-Service)"
    severity="High"
    description="A monolithic service handles authentication, authorization, user management, notifications, and analytics. This service has become a critical dependency for all other services."
    affectedFiles={[
      "/src/services/coreService.ts",
      "/src/api/auth.ts",
      "/src/api/users.ts"
    ]}
    whyItMatters="Any change or failure in this service impacts the entire system. Deployment risks are high, and the service cannot be scaled independently based on load patterns."
  />

  <ArcSightInsightCard
    title="Cross-Domain Coupling"
    severity="Medium"
    description="Payment service directly imports and calls functions from the user service, creating tight coupling between payment and user management domains."
    affectedFiles={[
      "/src/services/paymentService.ts",
      "/src/services/userService.ts"
    ]}
    whyItMatters="Changes to user service may break payment functionality. Services cannot evolve independently, and testing becomes more complex due to cross-domain dependencies."
  />
</div>
*/

