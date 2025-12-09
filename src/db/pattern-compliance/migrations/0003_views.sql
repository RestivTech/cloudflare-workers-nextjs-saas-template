-- Pattern Compliance Dashboard - Migration 0003
-- Views for common query patterns
-- Created: 2025-12-08

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
