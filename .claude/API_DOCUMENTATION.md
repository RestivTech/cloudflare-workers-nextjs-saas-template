# Pattern Compliance Dashboard - API Documentation

**Document**: Milestone 1.3 - Pattern/Repository CRUD APIs
**Created**: 2025-12-08
**Status**: Implementation In Progress

## Overview

The Pattern Compliance Dashboard provides RESTful APIs for managing patterns, repositories, violations, and approvals. All endpoints follow standard REST conventions and return JSON responses.

## API Response Format

### Success Response (2xx)

```json
{
  "success": true,
  "data": { /* actual data */ },
  "count": 10  // Optional: for list endpoints
}
```

### Error Response (4xx, 5xx)

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

## Authentication

Authentication is handled through your application's existing authentication layer. Include authentication tokens in the `Authorization` header for protected endpoints.

---

## Patterns API

### 1. List Patterns

**Endpoint**: `GET /api/pattern-compliance/patterns`

**Description**: Retrieve a list of patterns with optional filtering

**Query Parameters**:
- `category` (optional): `Security|Architecture|CodeStyle|Performance|Testing`
- `status` (optional): `active|deprecated|archived`
- `severity` (optional): `Critical|High|Medium|Low`

**Request**:
```bash
curl https://api.example.com/api/pattern-compliance/patterns?category=Security&status=active
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "pattern-123",
      "name": "Hardcoded Secrets Detection",
      "description": "Detects hardcoded API keys, passwords...",
      "category": "Security",
      "severity": "Critical",
      "status": "active",
      "detection_method": "regex",
      "detection_config": { "patterns": [...] },
      "file_patterns": ["*.ts", "*.js"],
      "exclusion_patterns": ["node_modules/**"],
      "remediation_guidance": "Use environment variables...",
      "remediation_link": "https://...",
      "created_at": "2025-12-08T12:00:00Z",
      "updated_at": "2025-12-08T12:00:00Z",
      "created_by": "user-123",
      "version": "1.0"
    }
  ],
  "count": 5
}
```

### 2. Create Pattern

**Endpoint**: `POST /api/pattern-compliance/patterns`

**Description**: Create a new pattern definition

**Request Body**:
```json
{
  "name": "Hardcoded Secrets Detection",
  "description": "Detects hardcoded API keys and passwords",
  "category": "Security",
  "severity": "Critical",
  "status": "active",
  "detectionMethod": "regex",
  "detectionConfig": {
    "patterns": [
      "password\\s*=",
      "api_key\\s*=",
      "secret\\s*="
    ]
  },
  "filePatterns": ["*.ts", "*.js", "*.py"],
  "exclusionPatterns": ["*.test.*", "node_modules/**"],
  "remediationGuidance": "Use environment variables or a secrets management system",
  "remediationLink": "https://owasp.org/www-community/Sensitive_Data_Exposure",
  "createdBy": "user-123"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "pattern-456",
    "name": "Hardcoded Secrets Detection",
    // ... full pattern object
  }
}
```

**Error Responses**:
- 400: Missing required field
- 409: Pattern with this name already exists
- 500: Server error

### 3. Get Pattern by ID

**Endpoint**: `GET /api/pattern-compliance/patterns/:id`

**Description**: Retrieve a specific pattern by ID

**Request**:
```bash
curl https://api.example.com/api/pattern-compliance/patterns/pattern-123
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "pattern-123",
    "name": "Hardcoded Secrets Detection",
    // ... full pattern object
  }
}
```

**Error Responses**:
- 404: Pattern not found
- 500: Server error

### 4. Update Pattern

**Endpoint**: `PUT /api/pattern-compliance/patterns/:id`

**Description**: Update an existing pattern

**Request Body** (all fields optional):
```json
{
  "name": "Updated Pattern Name",
  "status": "deprecated",
  "remediationGuidance": "Updated remediation steps",
  "updatedBy": "user-456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "pattern-123",
    "name": "Updated Pattern Name",
    // ... updated pattern object
  }
}
```

**Error Responses**:
- 404: Pattern not found
- 409: A pattern with the new name already exists
- 500: Server error

### 5. Delete Pattern

**Endpoint**: `DELETE /api/pattern-compliance/patterns/:id`

**Description**: Delete a pattern

**Request**:
```bash
curl -X DELETE https://api.example.com/api/pattern-compliance/patterns/pattern-123
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Pattern deleted successfully"
}
```

**Error Responses**:
- 404: Pattern not found
- 500: Server error

---

## Repositories API

### 1. List Repositories

**Endpoint**: `GET /api/pattern-compliance/repositories`

**Description**: Retrieve a list of repositories with optional filtering

**Query Parameters**:
- `ownerTeam` (optional): Team ID filter
- `scanFrequency` (optional): `manual|daily|weekly|monthly`

**Request**:
```bash
curl https://api.example.com/api/pattern-compliance/repositories?scanFrequency=daily
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "repo-123",
      "name": "API Gateway",
      "url": "https://github.com/example/api-gateway",
      "owner_team": "team-123",
      "patterns": ["pattern-123", "pattern-456"],
      "scan_frequency": "daily",
      "last_scan_at": "2025-12-08T12:00:00Z",
      "last_scan_status": "success",
      "is_public": true,
      "auto_create_tickets": false,
      "created_at": "2025-12-08T12:00:00Z",
      "updated_at": "2025-12-08T12:00:00Z",
      "created_by": "user-123"
    }
  ],
  "count": 3
}
```

### 2. Create Repository

**Endpoint**: `POST /api/pattern-compliance/repositories`

**Description**: Add a new repository to scan

**Request Body**:
```json
{
  "name": "API Gateway",
  "url": "https://github.com/example/api-gateway",
  "ownerTeam": "team-123",
  "patterns": ["pattern-123", "pattern-456"],
  "scanFrequency": "daily",
  "isPublic": true,
  "autoCreateTickets": false,
  "ticketSystem": "github",
  "createdBy": "user-123"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "repo-789",
    "name": "API Gateway",
    // ... full repository object
  }
}
```

**Error Responses**:
- 400: Missing required field or invalid URL
- 409: Repository with this URL already exists
- 500: Server error

### 3. Get Repository by ID

**Endpoint**: `GET /api/pattern-compliance/repositories/:id`

**Description**: Retrieve a specific repository

**Request**:
```bash
curl https://api.example.com/api/pattern-compliance/repositories/repo-123
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "repo-123",
    "name": "API Gateway",
    // ... full repository object
  }
}
```

**Error Responses**:
- 404: Repository not found
- 500: Server error

### 4. Update Repository

**Endpoint**: `PUT /api/pattern-compliance/repositories/:id`

**Description**: Update a repository configuration

**Request Body** (all fields optional):
```json
{
  "scanFrequency": "weekly",
  "lastScanStatus": "success",
  "patterns": ["pattern-123", "pattern-789"],
  "autoCreateTickets": true,
  "updatedBy": "user-456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "repo-123",
    "name": "API Gateway",
    // ... updated repository object
  }
}
```

**Error Responses**:
- 404: Repository not found
- 409: A repository with the new URL already exists
- 500: Server error

### 5. Delete Repository

**Endpoint**: `DELETE /api/pattern-compliance/repositories/:id`

**Description**: Remove a repository from scanning

**Request**:
```bash
curl -X DELETE https://api.example.com/api/pattern-compliance/repositories/repo-123
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Repository deleted successfully"
}
```

**Error Responses**:
- 404: Repository not found
- 500: Server error

---

## Violations API

### 1. List Violations

**Endpoint**: `GET /api/pattern-compliance/violations`

**Description**: Retrieve violations with advanced filtering and pagination

**Query Parameters**:
- `status` (optional): `open|resolved|suppressed|wontfix`
- `approvalStatus` (optional): `pending|approved|rejected`
- `severity` (optional): `Critical|High|Medium|Low`
- `repositoryId` (optional): Filter by repository ID
- `patternId` (optional): Filter by pattern ID
- `limit` (optional): Results per page (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Special Query Parameters**:
- `byRepository=:repoId` - Get violations for specific repository
- `byPattern=:patternId` - Get violations for specific pattern
- `awaitingApproval=true` - Get violations pending approval

**Request**:
```bash
curl "https://api.example.com/api/pattern-compliance/violations?status=open&severity=Critical"
curl "https://api.example.com/api/pattern-compliance/violations?byRepository=repo-123"
curl "https://api.example.com/api/pattern-compliance/violations?awaitingApproval=true"
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "violation-123",
      "repository_id": "repo-456",
      "repository_name": "API Gateway",
      "pattern_id": "pattern-789",
      "pattern_name": "Hardcoded Secrets Detection",
      "file_path": "src/config.ts",
      "status": "open",
      "approval_status": "pending",
      "severity": "Critical",
      "first_detected_at": "2025-12-08T12:00:00Z",
      "created_at": "2025-12-08T12:00:00Z"
    }
  ],
  "count": 15
}
```

### 2. Get Violation by ID

**Endpoint**: `GET /api/pattern-compliance/violations/:id`

**Description**: Retrieve detailed information about a specific violation

**Request**:
```bash
curl https://api.example.com/api/pattern-compliance/violations/violation-123
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "violation-123",
    "repository_id": "repo-456",
    "repository_name": "API Gateway",
    "repository_url": "https://github.com/example/api-gateway",
    "pattern_id": "pattern-789",
    "pattern_name": "Hardcoded Secrets Detection",
    "pattern_category": "Security",
    "pattern_severity": "Critical",
    "file_path": "src/config.ts",
    "line_number": 42,
    "column_number": 15,
    "code_snippet": "const apiKey = 'sk-xxx-yyy-zzz';",
    "status": "open",
    "approval_status": "pending",
    "severity": "Critical",
    "first_detected_at": "2025-12-08T12:00:00Z",
    "created_at": "2025-12-08T12:00:00Z",
    "approval_method": "email",
    "approver_id": null
  }
}
```

**Error Responses**:
- 404: Violation not found
- 500: Server error

### 3. Update Violation Status

**Endpoint**: `PUT /api/pattern-compliance/violations/:id`

**Description**: Update the status of a violation

**Status Values**:
- `open` - Violation is active
- `resolved` - Issue has been fixed
- `suppressed` - Violation is acknowledged but not fixing
- `wontfix` - Will not be fixed (intentional)

**Request Body**:
```json
{
  "status": "resolved",
  "statusComment": "Fixed by updating config to use environment variables",
  "updatedBy": "user-456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "violation-123",
    "status": "resolved",
    "status_comment": "Fixed by updating config...",
    "updated_at": "2025-12-08T14:30:00Z"
  },
  "message": "Violation status updated to resolved"
}
```

**Error Responses**:
- 400: Invalid status value
- 500: Server error

---

## Approvals API

### 1. List Approvals

**Endpoint**: `GET /api/pattern-compliance/approvals`

**Description**: Retrieve all approvals with advanced filtering

**Query Parameters**:
- `status` (optional): `pending|approved|rejected`
- `approverId` (optional): Filter by approver ID
- `violationId` (optional): Filter by violation ID
- `repositoryId` (optional): Filter by repository ID
- `userId` (optional): Get approvals for specific user (overrides other filters)
- `limit` (optional): Results per page (default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Request**:
```bash
curl https://api.example.com/api/pattern-compliance/approvals?status=pending
curl https://api.example.com/api/pattern-compliance/approvals?userId=user-123&status=pending
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "approval-123",
      "violation_id": "violation-456",
      "repository_name": "API Gateway",
      "pattern_name": "Hardcoded Secrets Detection",
      "file_path": "src/config.ts",
      "severity": "Critical",
      "status": "pending",
      "approver_id": "user-789",
      "approver_email": "approver@example.com",
      "assigned_at": "2025-12-08T12:00:00Z",
      "due_at": "2025-12-15T12:00:00Z",
      "approved_at": null,
      "rejected_at": null,
      "sla_status": "on-track"
    }
  ],
  "count": 5
}
```

### 2. Get User's Approvals

**Endpoint**: `GET /api/pattern-compliance/approvals?userId=:userId`

**Description**: Get all approvals assigned to a specific user with SLA status

**Query Parameters**:
- `userId` (required): User ID to get approvals for
- `status` (optional): Filter by approval status
- `limit` (optional): Results per page
- `offset` (optional): Pagination offset

**Request**:
```bash
curl https://api.example.com/api/pattern-compliance/approvals?userId=user-123
curl https://api.example.com/api/pattern-compliance/approvals?userId=user-123&status=pending
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "approval-123",
      "violation_id": "violation-456",
      "repository_name": "API Gateway",
      "pattern_name": "Hardcoded Secrets Detection",
      "file_path": "src/config.ts",
      "line_number": 42,
      "code_snippet": "const apiKey = 'sk-xxx-yyy-zzz';",
      "severity": "Critical",
      "status": "pending",
      "assigned_at": "2025-12-08T12:00:00Z",
      "due_at": "2025-12-15T12:00:00Z",
      "sla_status": "on-track",
      "created_at": "2025-12-08T12:00:00Z"
    }
  ],
  "count": 3,
  "userId": "user-123"
}
```

**Error Responses**:
- 500: Server error

### 3. Get Approval History for Violation

**Endpoint**: `GET /api/pattern-compliance/approvals/:violationId`

**Description**: Get complete approval history (all decisions) for a violation

**Request**:
```bash
curl https://api.example.com/api/pattern-compliance/approvals/violation-456
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "approval-123",
      "status": "approved",
      "approver_id": "user-789",
      "approver_email": "approver@example.com",
      "assigned_at": "2025-12-08T12:00:00Z",
      "approved_at": "2025-12-08T14:30:00Z",
      "rejected_at": null,
      "decision_reason": "Verified and fixed via environment variables",
      "created_at": "2025-12-08T12:00:00Z"
    }
  ],
  "violationId": "violation-456"
}
```

**Error Responses**:
- 500: Server error

### 4. Approve a Violation

**Endpoint**: `POST /api/pattern-compliance/approvals/:violationId`

**Description**: Approve a violation and create approval record

**Request Body**:
```json
{
  "action": "approve",
  "approverId": "user-123",
  "decisionReason": "Verified fix via environment variables"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "approval-123",
    "violation_id": "violation-456",
    "approver_id": "user-123",
    "status": "approved",
    "decision_reason": "Verified fix via environment variables",
    "approved_at": "2025-12-08T14:30:00Z",
    "created_at": "2025-12-08T14:30:00Z"
  },
  "message": "Violation approved successfully"
}
```

**Error Responses**:
- 400: Missing required fields or invalid action
- 500: Server error

### 5. Reject a Violation

**Endpoint**: `POST /api/pattern-compliance/approvals/:violationId`

**Description**: Reject a violation approval and create approval record

**Request Body**:
```json
{
  "action": "reject",
  "approverId": "user-123",
  "decisionReason": "Does not meet compliance requirements"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "approval-124",
    "violation_id": "violation-456",
    "approver_id": "user-123",
    "status": "rejected",
    "decision_reason": "Does not meet compliance requirements",
    "rejected_at": "2025-12-08T15:00:00Z",
    "created_at": "2025-12-08T15:00:00Z"
  },
  "message": "Violation rejected successfully"
}
```

**Error Responses**:
- 400: Missing required fields or invalid action
- 500: Server error

---

## Planned APIs (Future Phase)

### Metrics API
- `GET /api/pattern-compliance/metrics/repository/:repoId` - Get compliance metrics
- `GET /api/pattern-compliance/metrics/dashboard` - Get overall dashboard metrics

---

## Error Handling

### HTTP Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Missing required field, invalid format |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate name/URL |
| 500 | Server Error | Database error, internal error |

### Common Error Messages

```json
{
  "success": false,
  "error": "Missing required field: name"
}
```

```json
{
  "success": false,
  "error": "Pattern with this name already exists"
}
```

```json
{
  "success": false,
  "error": "Invalid URL format"
}
```

---

## Audit Logging

All API operations (create, update, delete) are automatically logged in the audit log:

```json
{
  "id": "audit-123",
  "action": "pattern_created",
  "resource_type": "pattern",
  "resource_id": "pattern-456",
  "user_id": "user-123",
  "user_email": "user@example.com",
  "details": {
    "name": "Hardcoded Secrets Detection",
    "severity": "Critical"
  },
  "created_at": "2025-12-08T12:00:00Z"
}
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
// List patterns
const response = await fetch('/api/pattern-compliance/patterns?category=Security');
const { data: patterns } = await response.json();

// Create pattern
const newPattern = await fetch('/api/pattern-compliance/patterns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "New Pattern",
    category: "Security",
    severity: "High",
    detectionMethod: "regex",
    detectionConfig: { patterns: [...] },
    createdBy: "user-123"
  })
});

// Update pattern
await fetch('/api/pattern-compliance/patterns/pattern-123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: "deprecated",
    updatedBy: "user-456"
  })
});

// Delete pattern
await fetch('/api/pattern-compliance/patterns/pattern-123', {
  method: 'DELETE'
});
```

### cURL

```bash
# List repositories
curl https://api.example.com/api/pattern-compliance/repositories

# Create repository
curl -X POST https://api.example.com/api/pattern-compliance/repositories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Repo",
    "url": "https://github.com/example/new-repo",
    "createdBy": "user-123"
  }'

# Update repository
curl -X PUT https://api.example.com/api/pattern-compliance/repositories/repo-123 \
  -H "Content-Type: application/json" \
  -d '{"scanFrequency": "weekly"}'

# Delete repository
curl -X DELETE https://api.example.com/api/pattern-compliance/repositories/repo-123
```

---

## Rate Limiting

Currently, there are no rate limits implemented. Rate limiting will be added in a future release.

---

## Versioning

This is version 1.0 of the API. Future versions may introduce backward-compatible changes or new endpoints.

---

## Support

For questions or issues with the API, please refer to:
- Implementation plan: `.claude/IMPLEMENTATION_PLAN.md`
- Database schema: `.claude/ARCHITECTURE.md` → Database Design section
- Related documentation: `CLAUDE.md` → Template Cleanup section

---

**Last Updated**: 2025-12-08
**Next Review**: When adding Violation and Approval APIs
