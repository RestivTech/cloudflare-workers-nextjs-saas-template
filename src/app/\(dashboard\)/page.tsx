import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react'

export default function DashboardHome() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to Pattern Compliance Dashboard. Monitor patterns, violations, and approvals.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<AlertCircle className="w-8 h-8" />}
          title="Open Violations"
          value="24"
          color="text-red-500"
        />
        <StatCard
          icon={<Clock className="w-8 h-8" />}
          title="Pending Approvals"
          value="5"
          color="text-yellow-500"
        />
        <StatCard
          icon={<CheckCircle className="w-8 h-8" />}
          title="Resolved Violations"
          value="142"
          color="text-green-500"
        />
        <StatCard
          icon={<TrendingUp className="w-8 h-8" />}
          title="Compliance Rate"
          value="89.2%"
          color="text-blue-500"
        />
      </div>

      {/* Getting Started */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Getting Started
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GettingStartedCard
            number="1"
            title="Create Patterns"
            description="Define detection rules for your organization"
            href="/patterns"
          />
          <GettingStartedCard
            number="2"
            title="Add Repositories"
            description="Configure repositories to scan for violations"
            href="/repositories"
          />
          <GettingStartedCard
            number="3"
            title="Review Violations"
            description="View and remediate detected compliance issues"
            href="/violations"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <ActionButton href="/patterns" label="+ New Pattern" />
          <ActionButton href="/repositories" label="+ Add Repository" />
          <ActionButton href="/approvals" label="View Approvals" />
          <ActionButton href="/admin/audit-log" label="View Audit Log" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Recent Activity
        </h2>
        <p className="text-muted-foreground">
          Recent violations, approvals, and pattern updates will appear here once data is available.
        </p>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode
  title: string
  value: string
  color: string
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className={`${color} mb-3`}>{icon}</div>
      <h3 className="text-sm text-muted-foreground">{title}</h3>
      <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
    </div>
  )
}

function GettingStartedCard({
  number,
  title,
  description,
  href,
}: {
  number: string
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="border border-border rounded-lg p-4 hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {number}
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </a>
  )
}

function ActionButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
    >
      {label}
    </a>
  )
}
