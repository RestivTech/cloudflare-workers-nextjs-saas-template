'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Settings, LogOut, BookOpen, Shield, Mail } from 'lucide-react'

export default function AdminPage() {
  const [settings, setSettings] = useState({
    enableEmailNotifications: true,
    autoApproveThreshold: 'low',
    scanTimeout: 300,
    maxConcurrentScans: 5,
    retentionDays: 90,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSettingChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      [key]: value,
    })
  }

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)
      // TODO: Call API to save settings
      alert('Settings saved successfully')
    } catch (error) {
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-muted-foreground mt-1">
          System configuration and administrative controls
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Quick Navigation */}
        <div className="col-span-1 space-y-4">
          <Link
            href="/admin/audit-log"
            className="block bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Audit Log</p>
                <p className="text-xs text-muted-foreground">View system activity</p>
              </div>
            </div>
          </Link>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-500" />
              <div>
                <p className="font-semibold text-foreground">Security</p>
                <p className="text-xs text-muted-foreground">Access & permissions</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-semibold text-foreground">Notifications</p>
                <p className="text-xs text-muted-foreground">Email & alerts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Configuration
            </h2>

            {/* Notification Settings */}
            <div className="space-y-3 pb-4 border-b border-border">
              <h3 className="font-medium text-foreground">Email Notifications</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableEmailNotifications}
                  onChange={(e) =>
                    handleSettingChange('enableEmailNotifications', e.target.checked)
                  }
                  className="w-4 h-4 border border-border rounded"
                />
                <span className="text-sm text-foreground">
                  Send email notifications for violations
                </span>
              </label>
            </div>

            {/* Approval Settings */}
            <div className="space-y-3 pb-4 border-b border-border">
              <h3 className="font-medium text-foreground">Approval Workflow</h3>
              <div>
                <label className="block text-sm text-foreground mb-2">
                  Auto-approve Threshold
                </label>
                <select
                  value={settings.autoApproveThreshold}
                  onChange={(e) =>
                    handleSettingChange('autoApproveThreshold', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="none">Require Manual Approval</option>
                  <option value="low">Auto-approve Low Severity</option>
                  <option value="medium">Auto-approve Medium & Low</option>
                </select>
              </div>
            </div>

            {/* Scan Settings */}
            <div className="space-y-3 pb-4 border-b border-border">
              <h3 className="font-medium text-foreground">Scan Configuration</h3>

              <div>
                <label className="block text-sm text-foreground mb-2">
                  Scan Timeout (seconds)
                </label>
                <input
                  type="number"
                  value={settings.scanTimeout}
                  onChange={(e) =>
                    handleSettingChange('scanTimeout', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>

              <div>
                <label className="block text-sm text-foreground mb-2">
                  Max Concurrent Scans
                </label>
                <input
                  type="number"
                  value={settings.maxConcurrentScans}
                  onChange={(e) =>
                    handleSettingChange('maxConcurrentScans', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
            </div>

            {/* Data Retention */}
            <div className="space-y-3">
              <h3 className="font-medium text-foreground">Data Retention</h3>
              <div>
                <label className="block text-sm text-foreground mb-2">
                  Keep records for (days)
                </label>
                <input
                  type="number"
                  value={settings.retentionDays}
                  onChange={(e) =>
                    handleSettingChange('retentionDays', parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Violations older than this will be archived
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-accent">
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              System Status
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">API Status</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Operational
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Database</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Connected
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Cache</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Available
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Scan</p>
                <p className="text-sm font-medium">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Danger Zone
            </h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-left">
                Clear all violations data
              </button>
              <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-left">
                Reset system configuration
              </button>
              <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-left">
                Purge audit log
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
