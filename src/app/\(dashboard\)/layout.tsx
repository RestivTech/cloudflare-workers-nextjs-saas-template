import { ReactNode } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-border p-6">
            <h1 className="text-2xl font-bold text-foreground">
              Pattern Compliance
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dashboard
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Main Navigation */}
              <NavLink href="/patterns" label="Patterns" icon="📋" />
              <NavLink href="/repositories" label="Repositories" icon="📦" />
              <NavLink href="/violations" label="Violations" icon="⚠️" />
              <NavLink href="/approvals" label="Approvals" icon="✅" />

              {/* Divider */}
              <div className="my-4 h-px bg-border" />

              {/* Admin Section */}
              <div className="px-2 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Admin
                </p>
              </div>
              <NavLink href="/admin" label="Settings" icon="⚙️" />
              <NavLink href="/admin/audit-log" label="Audit Log" icon="📖" />
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="text-xs text-muted-foreground">
              <p>Version 1.0</p>
              <p className="mt-1">© 2025 Pattern Compliance</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b border-border bg-card px-8 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-foreground">
            Dashboard
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-foreground hover:bg-accent transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
