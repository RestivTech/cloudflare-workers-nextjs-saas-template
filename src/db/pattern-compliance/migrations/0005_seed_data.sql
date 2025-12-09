-- Pattern Compliance Dashboard - Migration 0005
-- Initial seed data for development and testing
-- Created: 2025-12-08

-- ============================================================================
-- SEED DATA (for development)
-- ============================================================================

-- Insert default admin team (development)
INSERT OR IGNORE INTO teams (id, name, description, default_approval_method)
VALUES ('team-default', 'Default Team', 'Default team for initial setup', 'email');

-- Insert sample admin user (development - should be replaced)
INSERT OR IGNORE INTO users (id, email, name, role, team_id, is_active)
VALUES ('user-admin', 'admin@example.com', 'Admin User', 'admin', 'team-default', 1);

-- Insert sample patterns for testing
INSERT OR IGNORE INTO patterns (
  id, name, description, category, severity, status,
  detection_method, detection_config, file_patterns, exclusion_patterns,
  remediation_guidance, remediation_link, created_by, version
) VALUES
(
  'pattern-security-hardcoded-secrets',
  'Hardcoded Secrets Detection',
  'Detects hardcoded API keys, passwords, and other secrets in source code',
  'Security',
  'Critical',
  'active',
  'regex',
  '{"patterns": ["password\\s*=", "api_key\\s*=", "secret\\s*=", "token\\s*="]}',
  '["*.ts", "*.js", "*.py", "*.go"]',
  '["*.test.*", "*.example.*", "node_modules/**"]',
  'Use environment variables or a secrets management system like Vault',
  'https://owasp.org/www-community/Sensitive_Data_Exposure',
  'user-admin',
  '1.0'
),
(
  'pattern-arch-circular-deps',
  'Circular Dependencies Detection',
  'Identifies circular dependency patterns that can cause runtime issues',
  'Architecture',
  'High',
  'active',
  'ast',
  '{"check_type": "circular_imports"}',
  '["*.ts", "*.js"]',
  '["node_modules/**", "dist/**"]',
  'Refactor to break circular dependencies, consider reorganizing module structure',
  'https://en.wikipedia.org/wiki/Circular_dependency',
  'user-admin',
  '1.0'
),
(
  'pattern-codestyle-trailing-whitespace',
  'Trailing Whitespace',
  'Detects and flags trailing whitespace at end of lines',
  'CodeStyle',
  'Low',
  'active',
  'regex',
  '{"patterns": ["\\s+$"]}',
  '["*.ts", "*.tsx", "*.js", "*.jsx"]',
  '[]',
  'Remove trailing whitespace from lines',
  'https://prettier.io/',
  'user-admin',
  '1.0'
),
(
  'pattern-perf-n-plus-one',
  'N+1 Query Detection',
  'Identifies potential N+1 query patterns in database operations',
  'Performance',
  'High',
  'active',
  'ast',
  '{"check_type": "database_queries"}',
  '["*.ts", "*.js"]',
  '["node_modules/**"]',
  'Use batch queries or database joins instead of iterative queries',
  'https://use-the-index-luke.com/sql/join',
  'user-admin',
  '1.0'
),
(
  'pattern-testing-missing-tests',
  'Missing Test Coverage',
  'Flags functions without test coverage',
  'Testing',
  'Medium',
  'active',
  'ast',
  '{"check_type": "test_coverage"}',
  '["src/**/*.ts", "src/**/*.js"]',
  '["*.test.*", "*.spec.*", "node_modules/**"]',
  'Write comprehensive unit tests and integration tests',
  'https://istanbul.js.org/',
  'user-admin',
  '1.0'
);

-- Insert sample repositories for testing
INSERT OR IGNORE INTO repositories (
  id, name, url, owner_team,
  patterns, scan_frequency,
  created_by
) VALUES
(
  'repo-api-gateway',
  'API Gateway',
  'https://github.com/example/api-gateway',
  'team-default',
  '["pattern-security-hardcoded-secrets", "pattern-arch-circular-deps", "pattern-perf-n-plus-one"]',
  'weekly',
  'user-admin'
),
(
  'repo-auth-service',
  'Authentication Service',
  'https://github.com/example/auth-service',
  'team-default',
  '["pattern-security-hardcoded-secrets", "pattern-testing-missing-tests"]',
  'daily',
  'user-admin'
),
(
  'repo-dashboard',
  'Dashboard UI',
  'https://github.com/example/dashboard',
  'team-default',
  '["pattern-codestyle-trailing-whitespace", "pattern-testing-missing-tests"]',
  'manual',
  'user-admin'
);
