-- Pattern Compliance Dashboard - Migration 0001
-- Initial schema with core tables
-- Created: 2025-12-08

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Patterns Registry
CREATE TABLE IF NOT EXISTS patterns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'archived')),

  -- Detection Configuration
  detection_method TEXT NOT NULL CHECK (detection_method IN ('regex', 'ast', 'custom')),
  detection_config JSON NOT NULL,
  file_patterns JSON NOT NULL DEFAULT '[]',
  exclusion_patterns JSON DEFAULT '[]',

  -- Remediation
  remediation_guidance TEXT,
  remediation_link TEXT,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  version TEXT DEFAULT '1.0'
);

-- Repositories Configuration
CREATE TABLE IF NOT EXISTS repositories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  owner_team TEXT,

  -- Scanning Configuration
  patterns JSON NOT NULL DEFAULT '[]',
  scan_frequency TEXT DEFAULT 'manual' CHECK (scan_frequency IN ('manual', 'daily', 'weekly', 'monthly')),
  last_scan_at DATETIME,
  last_scan_status TEXT,

  -- GitHub Access
  github_token_ref TEXT,
  is_public BOOLEAN DEFAULT 1,

  -- Settings
  auto_create_tickets BOOLEAN DEFAULT 0,
  ticket_system TEXT,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Violations Detection Results
CREATE TABLE IF NOT EXISTS violations (
  id TEXT PRIMARY KEY,
  repository_id TEXT NOT NULL REFERENCES repositories(id),
  pattern_id TEXT NOT NULL REFERENCES patterns(id),

  -- Location
  file_path TEXT NOT NULL,
  line_number INTEGER,
  column_number INTEGER,
  code_snippet TEXT,

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'suppressed', 'wontfix')),
  status_comment TEXT,

  -- Remediation
  remediation_applied_at DATETIME,
  remediation_applied_by TEXT,
  remediation_link TEXT,

  -- Approval
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approval_required_level TEXT,
  approval_method TEXT DEFAULT 'email',
  approver_id TEXT,
  approval_date DATETIME,
  approval_reason TEXT,

  -- Metadata
  first_detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Severity (inherited from pattern)
  severity TEXT CHECK (severity IN ('Critical', 'High', 'Medium', 'Low'))
);

-- Approvals History & Workflow
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  violation_id TEXT NOT NULL REFERENCES violations(id),

  -- Approval Flow
  approval_step INTEGER DEFAULT 1,
  approver_id TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_at DATETIME,

  -- Response
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  response TEXT,
  response_at DATETIME,
  response_method TEXT,

  -- Notification
  notification_sent_at DATETIME,
  notification_method TEXT NOT NULL CHECK (notification_method IN ('email', 'slack', 'inapp')),
  notification_status TEXT,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log (Compliance & Security)
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  user_id TEXT,
  user_email TEXT,
  details JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- REFERENCE TABLES
-- ============================================================================

-- Teams (Organization Teams)
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Permissions
  repositories JSON DEFAULT '[]',
  patterns JSON DEFAULT '[]',

  -- Approval Settings
  requires_approval BOOLEAN DEFAULT 1,
  default_approval_method TEXT DEFAULT 'email',
  approval_sla_hours INTEGER DEFAULT 24,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users (Team Members)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'reviewer', 'developer', 'viewer')),
  team_id TEXT REFERENCES teams(id),

  -- Preferences
  notification_email TEXT,
  approval_slack_user_id TEXT,

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  is_active BOOLEAN DEFAULT 1
);
