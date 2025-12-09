-- Pattern Compliance Dashboard - Migration 0004
-- Triggers for automatic timestamp management and data integrity
-- Created: 2025-12-08

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
