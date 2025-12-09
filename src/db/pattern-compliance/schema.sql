-- Pattern Compliance Dashboard Schema
-- D1 SQLite Database
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

CREATE UNIQUE INDEX idx_patterns_name ON patterns(name);
CREATE INDEX idx_patterns_category ON patterns(category);
CREATE INDEX idx_patterns_status ON patterns(status);

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

CREATE UNIQUE INDEX idx_repos_url ON repositories(url);
CREATE INDEX idx_repos_owner_team ON repositories(owner_team);
CREATE INDEX idx_repos_scan_frequency ON repositories(scan_frequency);

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

CREATE INDEX idx_violations_repo ON violations(repository_id);
CREATE INDEX idx_violations_pattern ON violations(pattern_id);
CREATE INDEX idx_violations_status ON violations(status);
CREATE INDEX idx_violations_approval_status ON violations(approval_status);
CREATE INDEX idx_violations_severity ON violations(severity);
CREATE INDEX idx_violations_first_detected ON violations(first_detected_at);

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

CREATE INDEX idx_approvals_violation ON approvals(violation_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_assigned_at ON approvals(assigned_at);

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

CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================================================
-- REFERENCE TABLES
-- ============================================================================

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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_role ON users(role);

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

CREATE INDEX idx_teams_name ON teams(name);

-- ============================================================================
-- VIEWS (for common queries)
-- ============================================================================

-- Violations with Pattern & Repository Details
CREATE VIEW IF NOT EXISTS violations_with_details AS
SELECT
  v.id,
  v.repository_id,
  r.name as repository_name,
  r.url as repository_url,
  v.pattern_id,
  p.name as pattern_name,
  p.category,
  p.severity,
  v.file_path,
  v.line_number,
  v.status,
  v.approval_status,
  v.first_detected_at,
  v.created_at
FROM violations v
JOIN repositories r ON v.repository_id = r.id
JOIN patterns p ON v.pattern_id = p.id;

-- Pending Approvals
CREATE VIEW IF NOT EXISTS pending_approvals_queue AS
SELECT
  a.id as approval_id,
  v.id as violation_id,
  v.repository_id,
  r.name as repository_name,
  v.pattern_id,
  p.name as pattern_name,
  a.approver_id,
  u.email as approver_email,
  a.assigned_at,
  a.due_at,
  CASE
    WHEN a.due_at < CURRENT_TIMESTAMP THEN 'overdue'
    WHEN a.due_at < DATETIME('now', '+24 hours') THEN 'due-soon'
    ELSE 'on-track'
  END as sla_status
FROM approvals a
JOIN violations v ON a.violation_id = v.id
JOIN repositories r ON v.repository_id = r.id
JOIN patterns p ON v.pattern_id = p.id
JOIN users u ON a.approver_id = u.id
WHERE a.status = 'pending'
ORDER BY a.due_at ASC;

-- Compliance Metrics by Repository
CREATE VIEW IF NOT EXISTS repository_compliance_metrics AS
SELECT
  r.id,
  r.name,
  r.url,
  COUNT(DISTINCT v.id) as total_violations,
  COUNT(DISTINCT CASE WHEN v.status = 'open' THEN v.id END) as open_violations,
  COUNT(DISTINCT CASE WHEN v.status = 'resolved' THEN v.id END) as resolved_violations,
  COUNT(DISTINCT CASE WHEN v.severity = 'Critical' THEN v.id END) as critical_violations,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN v.status = 'resolved' THEN v.id END) /
        NULLIF(COUNT(DISTINCT v.id), 0), 2) as compliance_percentage,
  r.last_scan_at
FROM repositories r
LEFT JOIN violations v ON r.id = v.repository_id
GROUP BY r.id, r.name, r.url, r.last_scan_at;

-- ============================================================================
-- CONSTRAINTS & TRIGGERS
-- ============================================================================

-- Update timestamps automatically
CREATE TRIGGER IF NOT EXISTS patterns_update_timestamp
AFTER UPDATE ON patterns
BEGIN
  UPDATE patterns SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS repositories_update_timestamp
AFTER UPDATE ON repositories
BEGIN
  UPDATE repositories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS violations_update_timestamp
AFTER UPDATE ON violations
BEGIN
  UPDATE violations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS teams_update_timestamp
AFTER UPDATE ON teams
BEGIN
  UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- SEED DATA (optional, for development)
-- ============================================================================

-- Insert default admin team (development)
INSERT OR IGNORE INTO teams (id, name, description, default_approval_method)
VALUES ('team-default', 'Default Team', 'Default team for initial setup', 'email');

-- Insert sample admin user (development - should be replaced)
INSERT OR IGNORE INTO users (id, email, name, role, team_id, is_active)
VALUES ('user-admin', 'admin@example.com', 'Admin User', 'admin', 'team-default', 1);
