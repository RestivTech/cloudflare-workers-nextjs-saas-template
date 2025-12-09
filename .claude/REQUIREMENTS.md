# Pattern Compliance Dashboard - Refined Requirements

**Status**: Phase 2 - Requirements Refinement
**Date**: 2025-12-08
**Strategic Focus**: Flexible, reusable pattern enforcement (any standard, not just CF Access)

---

## Executive Summary

The **Pattern Compliance Dashboard** is a configurable enforcement tool that scans source code repositories to identify misalignment with organizational patterns, standards, and guidelines. It supports:

- **Generic Pattern Detection**: Any pattern or standard (not limited to CF Access HTTP Headers)
- **Flexible Scanning**: Regex-based fast filtering + AST-based deep analysis
- **Configurable Approvals**: Email (Resend) or Slack (human-input MCP) workflows
- **Cloudflare Deployment**: Runs on Cloudflare Workers with D1 database
- **Administrative Interface**: Dashboard for pattern management and approval configuration

---

## Business Objectives

### 1. Reduce Technical Debt
- **Problem**: Legacy code doesn't follow new patterns/standards
- **Solution**: Automated detection identifies misalignment across all repositories
- **Outcome**: Proactive remediation vs reactive firefighting

### 2. Enforce Organizational Standards
- **Problem**: Inconsistent implementation of approved patterns
- **Solution**: Dashboard makes standards discoverable and measurable
- **Outcome**: Consistent architecture across all services

### 3. Enable Selective Enforcement
- **Problem**: Different teams have different compliance needs
- **Solution**: Admins configure which patterns apply to which repositories
- **Outcome**: Flexibility without sacrificing standardization

### 4. Support Continuous Improvement
- **Problem**: Standards evolve but legacy code doesn't update
- **Solution**: Periodic scanning with approval workflows
- **Outcome**: Organizational learning and pattern iteration

---

## Functional Requirements

### FR-1: Pattern Registry Management

**Capability**: Store and manage organizational patterns/standards

**Details**:
- Create pattern definitions with:
  - Name and description
  - Category (e.g., "Security", "Architecture", "Code Style")
  - Severity level (Critical, High, Medium, Low)
  - Detection method (regex, AST pattern, custom)
  - Remediation guidance (link to documentation)

- Configure pattern scope:
  - Which repositories to scan
  - Which file types to check
  - Exclusion rules (paths, packages)

- Version patterns:
  - Track pattern changes over time
  - Support pattern versioning (v1.0, v1.1, etc.)
  - Rollback to previous patterns

**Example Pattern**:
```
Name: CF Access HTTP Headers (ADR-036)
Category: Security / Integration
Severity: High
Detection: Python/httpx client missing CF-Access-Client-Id header
Files: **/*client.py, **/*http*.py
Documentation: .claude/documentation/PATTERNS/cloudflare-access-http-headers-pattern.md
```

### FR-2: Repository Scanning

**Capability**: Scan repositories for pattern violations

**Details**:
- Scan trigger mechanisms:
  - Manual scan from dashboard
  - Scheduled scans (daily, weekly, monthly)
  - GitHub webhook on push (optional, phase 2)

- Scan execution:
  - Clone repository to temporary storage
  - Apply detection rules for each pattern
  - Generate violation report with:
    - File path and line number
    - Violation type and severity
    - Suggested remediation
    - Link to pattern documentation

- Performance optimization:
  - Parallel scanning of multiple patterns
  - Cache scan results to avoid re-scanning
  - Incremental scanning (changed files only)

- Supported repositories:
  - Public repositories (no auth required)
  - Private repositories (with GitHub PAT)
  - Self-hosted Git (with SSH/HTTPS URL)

### FR-3: Violation Reporting

**Capability**: Present violations in searchable, actionable format

**Details**:
- Dashboard views:
  - **Repository Overview**: Summary of violations by severity
  - **Pattern View**: All violations for a specific pattern
  - **Violation Detail**: Full context with remediation guidance
  - **Trends**: Historical data showing improvement/regression

- Report generation:
  - Export to CSV/JSON for analysis
  - Generate trend reports (weekly, monthly)
  - Team/owner assignment for violations

- Filtering and search:
  - By repository, pattern, severity, status
  - By owner/team
  - By date range

### FR-4: Approval Workflows

**Capability**: Configurable approval mechanisms for remediation actions

**Trigger Points**:
- Approval required before marking violation as resolved
- Approval required before suppressing/dismissing violations
- Approval required before pattern updates (admin only)

**Approval Methods** (configurable per pattern/repository):

#### Email Approvals (via Resend)
- Send approval request email with:
  - Violation details
  - Remediation summary
  - Approval/reject links
- Automatic status updates from email clicks
- Email log and audit trail

#### Slack Approvals (via human-input MCP)
- Send Slack message with:
  - Violation summary
  - Remediation link
  - Approve/Reject buttons
- Status updates in dashboard
- Audit trail in Slack

#### Multi-step Approvals
- Route to different approvers based on:
  - Severity level
  - Repository owner
  - Pattern category
- Support escalation if no response in timeframe
- SLA tracking for approval turnaround

### FR-5: Admin Dashboard

**Capability**: Administrative interface for pattern management

**Features**:
- **Pattern Management**:
  - Create/edit/delete patterns
  - Configure detection methods
  - Set severity levels and exclusions
  - View pattern usage across repositories

- **Repository Configuration**:
  - Add/remove repositories to scan
  - Configure scan frequency
  - Set approval workflows
  - Manage GitHub credentials (PATs)

- **User Management**:
  - Create teams with different roles
  - Assign repositories to teams
  - Configure approval chains
  - Audit log of all actions

- **Metrics and Analytics**:
  - Compliance score by repository
  - Violation trend analysis
  - Remediation time tracking
  - Team performance dashboard

---

## Non-Functional Requirements

### NFR-1: Performance
- Scan should complete in <5 minutes for 10MB repository
- Dashboard should respond in <1 second for queries
- Support scanning of 100+ repositories in parallel

### NFR-2: Scalability
- Support 1000+ patterns
- Support 10,000+ repositories
- Handle 1,000+ concurrent users (dashboard)

### NFR-3: Security
- Authenticate users via OAuth (GitHub, Google, or internal SSO)
- Encrypt GitHub PATs and API credentials
- Audit log all approval decisions
- RBAC for admin vs. user roles

### NFR-4: Reliability
- 99.9% uptime SLA
- Automatic failure recovery
- Backup of scan results and approval logs

### NFR-5: Compliance
- GDPR compliant (support data deletion)
- SOC 2 audit trail
- Encryption at rest and in transit

---

## Technical Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Web Frontend    │  │  Admin API       │                 │
│  │  (Dashboard)     │  │  (CRUD patterns, │                 │
│  │  Next.js/React   │  │   repos, users)  │                 │
│  └──────────────────┘  └──────────────────┘                 │
│           │                      │                           │
│           └──────────┬───────────┘                           │
│                      ▼                                        │
│            ┌──────────────────┐                              │
│            │   API Gateway    │                              │
│            │   (Auth, routing)│                              │
│            └──────────────────┘                              │
│                      │                                        │
│    ┌─────────────────┼─────────────────┐                    │
│    ▼                 ▼                 ▼                     │
│  ┌─────────┐   ┌──────────┐    ┌───────────────┐             │
│  │ Scanning│   │ Approval │    │  Reporting &  │             │
│  │ Engine  │   │ Handler  │    │  Analytics    │             │
│  └─────────┘   └──────────┘    └───────────────┘             │
│       │             │                   │                    │
└───────┼─────────────┼───────────────────┼────────────────────┘
        │             │                   │
        ▼             ▼                   ▼
    ┌──────────────────────────────────────────┐
    │   Cloudflare D1 Database                 │
    │   - Patterns                             │
    │   - Repositories                         │
    │   - Violations                           │
    │   - Approvals / Audit Log                │
    └──────────────────────────────────────────┘
        │
        ├─▶ External: GitHub API (clone repos, auth)
        ├─▶ External: Resend (email approvals)
        └─▶ External: human-input MCP (Slack approvals)
```

### Key Components

**1. Scanning Engine**
- Pattern detection using regex and AST analysis
- Repository cloning and temporary storage
- Violation aggregation and deduplication
- Parallel processing for performance

**2. Admin Interface**
- Built with Next.js (nextjs-saas-template)
- Shadcn UI for consistent design
- Tailwind CSS for styling
- Real-time updates via WebSockets (optional, phase 2)

**3. Approval Workflows**
- Resend integration for email approvals
- human-input MCP Server integration for Slack
- Automatic status updates on approval
- SLA tracking and escalation

**4. Reporting Engine**
- Violation aggregation by pattern, repository, severity
- Trend analysis and historical tracking
- CSV/JSON export
- Custom report generation

---

## User Roles and Workflows

### Role 1: Developer / Repository Owner
**Access**: View own repositories, remediate violations

**Workflow**:
1. Dashboard shows violations in their repositories
2. Reviews violation details and remediation guidance
3. Implements fix (e.g., adds CF Access headers to httpx client)
4. Submits remediation for approval
5. Receives approval via email or Slack
6. Marks violation as resolved

### Role 2: Code Reviewer / Team Lead
**Access**: Review and approve remediations

**Workflow**:
1. Receives approval notification (email or Slack)
2. Reviews violation and proposed fix
3. Approves or rejects with comment
4. Notification sent back to developer
5. Dashboard updated with approval status

### Role 3: Architect / Standards Owner
**Access**: Manage patterns and standards

**Workflow**:
1. Creates new pattern based on organizational decision
2. Configures detection method (regex, AST, custom)
3. Sets severity and remediation guidance
4. Assigns to repositories
5. Monitors adoption via metrics dashboard
6. Updates pattern based on feedback

### Role 4: Admin / Operations
**Access**: Full dashboard, user management, audit log

**Workflow**:
1. Manages users and team assignments
2. Configures approval workflows and SLAs
3. Monitors system health and performance
4. Reviews audit logs
5. Manages GitHub PATs and credentials
6. Generates compliance reports

---

## Success Metrics

### Adoption Metrics
- Number of patterns created and deployed
- Number of repositories scanned
- Percentage of violations remediated
- Time to remediate (average, by severity)

### Quality Metrics
- Compliance score by repository
- Violation detection accuracy (false positive rate)
- Approval turnaround time (SLA adherence)

### Business Metrics
- Reduction in technical debt (estimated LOC)
- Time saved by developers (pattern discovery time)
- Consistency improvement (pattern adoption %)
- Cost savings from reduced rework

---

## Acceptance Criteria

### Phase 1 (MVP)
- [ ] Pattern registry with CRUD operations
- [ ] Repository scanning (manual trigger)
- [ ] Violation reporting with basic filtering
- [ ] Email approvals via Resend
- [ ] Basic admin dashboard
- [ ] D1 database schema and migrations

### Phase 2 (Enhancement)
- [ ] Slack approvals via human-input MCP
- [ ] Scheduled/automated scans
- [ ] Analytics and trend reporting
- [ ] Multi-step approval workflows
- [ ] User and team management

### Phase 3 (Advanced)
- [ ] GitHub webhooks for automatic scanning
- [ ] Custom detection methods (custom code execution)
- [ ] Real-time notifications
- [ ] Advanced analytics and ML-based recommendations
- [ ] Integration with other tools (Jira, GitHub, etc.)

---

## Assumptions and Constraints

### Assumptions
- GitHub repositories are accessible (public or with provided PAT)
- Developers have access to pattern documentation
- Approvers can receive email or Slack notifications
- D1 database provides sufficient performance for initial scale

### Constraints
- Cloudflare Workers max execution time: 30 seconds (scanning must be async)
- D1 max DB size: ~2GB (initial phase acceptable)
- No real-time database subscriptions (check status manually)
- Rate limiting on external APIs (Resend, Slack, GitHub)

---

## Appendix: Pattern Examples

### Example 1: CF Access HTTP Headers
```yaml
name: CF Access HTTP Headers (ADR-036)
category: Security/Integration
severity: High
description: HTTP clients accessing Cloudflare Access protected services must include CF-Access-Client-Id and CF-Access-Client-Secret headers
detection:
  method: regex
  patterns:
    - file_type: "*.py"
      pattern: 'httpx\.AsyncClient.*(?!CF-Access-Client-Id)'
    - file_type: "*.ts"
      pattern: 'fetch\(.*(?!CF-Access-Client-Id)'
remediation: |
  Add CF Access headers to HTTP client initialization.
  See: .claude/documentation/PATTERNS/cloudflare-access-http-headers-pattern.md
documentation: https://github.com/RestivTech/restiv-infrastructure/blob/main/.claude/documentation/decisions/ADR-036-cloudflare-access-http-headers-default-pattern.md
```

### Example 2: Proper Error Handling
```yaml
name: Proper Error Handling in Async Functions
category: Code Quality
severity: Medium
description: All async functions must have try-catch blocks or proper error handling
detection:
  method: ast
  language: typescript
  pattern: |
    FunctionDeclaration {
      async: true
      body: Block {
        !contains: TryStatement
      }
    }
remediation: |
  Wrap async function body in try-catch block
documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
```

### Example 3: TypeScript Strict Mode
```yaml
name: TypeScript Strict Mode
category: Code Quality
severity: Low
description: All TypeScript files should have strict mode enabled
detection:
  method: regex
  patterns:
    - file_type: "tsconfig.json"
      pattern: '"strict":\s*false'
remediation: |
  Set "strict": true in tsconfig.json
documentation: https://www.typescriptlang.org/tsconfig#strict
```

---

## Next Steps

1. **Architecture Design** (Phase 1)
   - Design D1 schema
   - Plan API endpoints
   - Design React components

2. **Implementation Planning**
   - Break down into sprints/milestones
   - Assign story points
   - Create GitHub issues

3. **Development**
   - Set up project structure
   - Implement scanning engine
   - Build admin dashboard
   - Integrate approval workflows

---

**Document Version**: 1.0
**Last Updated**: 2025-12-08
**Next Review**: After Phase 1 MVP completion
