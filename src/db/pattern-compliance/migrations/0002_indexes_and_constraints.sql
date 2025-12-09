-- Pattern Compliance Dashboard - Migration 0002
-- Indexes and constraints for optimal query performance
-- Created: 2025-12-08

-- ============================================================================
-- UNIQUENESS CONSTRAINTS
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_patterns_name ON patterns(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_repos_url ON repositories(url);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Patterns Table Indexes
CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(category);
CREATE INDEX IF NOT EXISTS idx_patterns_status ON patterns(status);
CREATE INDEX IF NOT EXISTS idx_patterns_severity ON patterns(severity);
CREATE INDEX IF NOT EXISTS idx_patterns_created_at ON patterns(created_at);

-- Repositories Table Indexes
CREATE INDEX IF NOT EXISTS idx_repos_owner_team ON repositories(owner_team);
CREATE INDEX IF NOT EXISTS idx_repos_scan_frequency ON repositories(scan_frequency);
CREATE INDEX IF NOT EXISTS idx_repos_last_scan_at ON repositories(last_scan_at);
CREATE INDEX IF NOT EXISTS idx_repos_created_at ON repositories(created_at);

-- Violations Table Indexes (Most Queried)
CREATE INDEX IF NOT EXISTS idx_violations_repo ON violations(repository_id);
CREATE INDEX IF NOT EXISTS idx_violations_pattern ON violations(pattern_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
CREATE INDEX IF NOT EXISTS idx_violations_approval_status ON violations(approval_status);
CREATE INDEX IF NOT EXISTS idx_violations_severity ON violations(severity);
CREATE INDEX IF NOT EXISTS idx_violations_first_detected ON violations(first_detected_at);
CREATE INDEX IF NOT EXISTS idx_violations_repo_status ON violations(repository_id, status);
CREATE INDEX IF NOT EXISTS idx_violations_approver ON violations(approver_id);
CREATE INDEX IF NOT EXISTS idx_violations_repo_pattern ON violations(repository_id, pattern_id);

-- Approvals Table Indexes
CREATE INDEX IF NOT EXISTS idx_approvals_violation ON approvals(violation_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_assigned_at ON approvals(assigned_at);
CREATE INDEX IF NOT EXISTS idx_approvals_due_at ON approvals(due_at);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_status ON approvals(approver_id, status);
CREATE INDEX IF NOT EXISTS idx_approvals_notification_method ON approvals(notification_method);

-- Audit Log Indexes
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_user_action ON audit_log(user_id, action);

-- Users Table Indexes
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Teams Table Indexes
CREATE INDEX IF NOT EXISTS idx_teams_created_at ON teams(created_at);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS (Explicitly created for clarity)
-- ============================================================================

-- Note: Foreign keys are implicitly created via REFERENCES in table definitions
-- These explicit indexes on foreign key columns improve JOIN performance

CREATE INDEX IF NOT EXISTS idx_violations_fk_repo ON violations(repository_id);
CREATE INDEX IF NOT EXISTS idx_violations_fk_pattern ON violations(pattern_id);
CREATE INDEX IF NOT EXISTS idx_approvals_fk_violation ON approvals(violation_id);
CREATE INDEX IF NOT EXISTS idx_users_fk_team ON users(team_id);
