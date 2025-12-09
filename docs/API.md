# API Documentation

Complete reference for the Pattern Compliance Dashboard REST API.

## Base URL

- **Production**: `https://pattern-compliance.deltaops.ca/api`
- **Staging**: `https://pattern-compliance-staging.deltaops.ca/api`
- **Local**: `http://localhost:3000/api`

## Authentication

All endpoints require valid authentication headers:

```bash
Authorization: Bearer <jwt_token>
X-Request-ID: <unique-request-id>
Content-Type: application/json
```

## Error Handling

All API responses follow a standard format:

### Success Response (200-299)
```json
{
  "success": true,
  "data": {
    "id": "pattern_123",
    "name": "API Usage Pattern"
  }
}
```

### Error Response (400-599)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": {
      "name": "Field is required"
    },
    "requestId": "req_abc123"
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Invalid or missing credentials |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

## Health & Status

### Health Check

**Endpoint**: `GET /health`

**Description**: Check system health and component status

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-09T10:00:00Z",
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "healthy",
      "latency": 45
    },
    "cache": {
      "status": "healthy",
      "latency": 12
    },
    "api": {
      "status": "healthy",
      "latency": 58
    }
  }
}
```

**Status Codes**:
- `200`: All systems healthy
- `503`: One or more systems unhealthy

### Metrics

**Endpoint**: `GET /metrics`

**Description**: Get current system metrics

**Response**:
```json
{
  "memory": {
    "used": 1073741824,
    "total": 2147483648,
    "percentage": 50.0
  },
  "uptime": 86400000,
  "requestsPerSecond": 125.5,
  "averageResponseTime": 245.3,
  "errorRate": 0.05,
  "timestamp": "2025-12-09T10:00:00Z"
}
```

## Patterns API

### List Patterns

**Endpoint**: `GET /patterns`

**Query Parameters**:
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `search` (string) - Search pattern name
- `sort` (string, default: "name") - Sort field
- `category` (string) - Filter by category

**Example**:
```bash
curl "https://pattern-compliance.deltaops.ca/api/patterns?page=1&limit=20&category=security"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "pattern_001",
        "name": "API Authentication",
        "category": "security",
        "description": "Secure API endpoint authentication",
        "compliance": 85,
        "violations": 2,
        "lastReviewed": "2025-12-08T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156
    }
  }
}
```

### Get Pattern Detail

**Endpoint**: `GET /patterns/:patternId`

**Example**:
```bash
curl "https://pattern-compliance.deltaops.ca/api/patterns/pattern_001"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "pattern_001",
    "name": "API Authentication",
    "category": "security",
    "description": "Secure API endpoint authentication",
    "requirements": [
      {
        "id": "req_001",
        "title": "OAuth 2.0 support",
        "priority": "high",
        "status": "implemented"
      }
    ],
    "compliance": 85,
    "violations": 2,
    "approvals": 15,
    "lastReviewed": "2025-12-08T14:30:00Z"
  }
}
```

### Create Pattern

**Endpoint**: `POST /patterns`

**Request Body**:
```json
{
  "name": "API Rate Limiting",
  "category": "performance",
  "description": "Rate limiting for API endpoints",
  "requirements": [
    {
      "title": "Token bucket algorithm",
      "priority": "high"
    }
  ]
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "pattern_new",
    "name": "API Rate Limiting",
    "createdAt": "2025-12-09T10:00:00Z"
  }
}
```

### Update Pattern

**Endpoint**: `PUT /patterns/:patternId`

**Request Body**:
```json
{
  "name": "API Rate Limiting (Updated)",
  "description": "Updated description"
}
```

**Response**: `200 OK`

### Delete Pattern

**Endpoint**: `DELETE /patterns/:patternId`

**Response**: `204 No Content`

## Violations API

### List Violations

**Endpoint**: `GET /violations`

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string) - Filter by status: open, resolved, ignored
- `severity` (string) - Filter by severity: low, medium, high, critical
- `patternId` (string) - Filter by pattern

**Example**:
```bash
curl "https://pattern-compliance.deltaops.ca/api/violations?status=open&severity=high"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "violation_001",
        "patternId": "pattern_001",
        "title": "Missing API authentication",
        "severity": "critical",
        "status": "open",
        "affectedResources": ["GET /users", "POST /users"],
        "detectedAt": "2025-12-08T09:15:00Z",
        "resolvedAt": null
      }
    ],
    "summary": {
      "total": 45,
      "open": 12,
      "resolved": 30,
      "ignored": 3
    }
  }
}
```

### Get Violation Detail

**Endpoint**: `GET /violations/:violationId`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "violation_001",
    "patternId": "pattern_001",
    "title": "Missing API authentication",
    "description": "Detailed description of violation",
    "severity": "critical",
    "status": "open",
    "affectedResources": ["GET /users", "POST /users"],
    "recommendation": "Implement OAuth 2.0 authentication",
    "detectedAt": "2025-12-08T09:15:00Z",
    "comments": [
      {
        "id": "comment_1",
        "author": "john@example.com",
        "text": "We're working on this",
        "createdAt": "2025-12-08T10:00:00Z"
      }
    ]
  }
}
```

### Update Violation Status

**Endpoint**: `PATCH /violations/:violationId`

**Request Body**:
```json
{
  "status": "resolved",
  "comment": "Fixed with OAuth 2.0 implementation"
}
```

**Response**: `200 OK`

### Resolve Violation

**Endpoint**: `POST /violations/:violationId/resolve`

**Request Body**:
```json
{
  "resolutionType": "fixed",
  "notes": "Implemented OAuth 2.0"
}
```

**Response**: `200 OK`

## Approvals API

### List Approvals

**Endpoint**: `GET /approvals`

**Query Parameters**:
- `status` (string) - pending, approved, rejected
- `patternId` (string) - Filter by pattern
- `assignee` (string) - Filter by assignee

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "approval_001",
        "patternId": "pattern_001",
        "title": "Security pattern implementation",
        "status": "pending",
        "requestedBy": "john@example.com",
        "assignees": ["security-team@example.com"],
        "dueDate": "2025-12-15T23:59:59Z",
        "createdAt": "2025-12-08T09:00:00Z"
      }
    ]
  }
}
```

### Get Approval Detail

**Endpoint**: `GET /approvals/:approvalId`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "approval_001",
    "patternId": "pattern_001",
    "title": "Security pattern implementation",
    "description": "Review and approve security pattern",
    "status": "pending",
    "requestedBy": {
      "id": "user_john",
      "email": "john@example.com",
      "name": "John Doe"
    },
    "assignees": [
      {
        "id": "user_sec",
        "email": "security@example.com",
        "name": "Security Team"
      }
    ],
    "reviewHistory": [
      {
        "reviewer": "security@example.com",
        "action": "viewed",
        "timestamp": "2025-12-08T10:00:00Z"
      }
    ],
    "dueDate": "2025-12-15T23:59:59Z"
  }
}
```

### Approve Request

**Endpoint**: `POST /approvals/:approvalId/approve`

**Request Body**:
```json
{
  "comment": "Approved - implementation meets requirements"
}
```

**Response**: `200 OK`

### Reject Request

**Endpoint**: `POST /approvals/:approvalId/reject`

**Request Body**:
```json
{
  "reason": "Missing security headers validation",
  "comment": "Please add validation for security headers"
}
```

**Response**: `200 OK`

## Monitoring API

### Dashboard Data

**Endpoint**: `GET /monitoring/dashboard`

**Response**:
```json
{
  "success": true,
  "data": {
    "complianceScore": 85,
    "patternsTotal": 156,
    "patternsCompliant": 132,
    "violationsOpen": 12,
    "approvalsAwaitingAction": 5,
    "recentActivity": [
      {
        "id": "activity_1",
        "type": "violation_resolved",
        "title": "Security pattern violation resolved",
        "timestamp": "2025-12-09T09:30:00Z"
      }
    ]
  }
}
```

### Reports

**Endpoint**: `GET /monitoring/reports/:reportType`

**Types**:
- `compliance` - Compliance score report
- `violations` - Violations summary
- `trends` - Compliance trends over time

**Example**:
```bash
curl "https://pattern-compliance.deltaops.ca/api/monitoring/reports/compliance?timeRange=30d"
```

## Rate Limiting

All endpoints are rate limited to prevent abuse:

- **Default**: 100 requests per minute
- **Authenticated**: 1000 requests per minute

Rate limit information included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1702190400
```

## Pagination

List endpoints support pagination with:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "hasMore": true
  }
}
```

## Webhooks (Future)

Webhook events for pattern compliance changes:

**Supported Events**:
- `pattern.created`
- `pattern.updated`
- `violation.detected`
- `violation.resolved`
- `approval.requested`
- `approval.approved`
- `approval.rejected`

## SDK & Client Libraries

### JavaScript/TypeScript

```bash
npm install @pattern-compliance/sdk
```

Usage:
```typescript
import { PatternComplianceClient } from '@pattern-compliance/sdk'

const client = new PatternComplianceClient({
  baseURL: 'https://pattern-compliance.deltaops.ca/api',
  token: 'your-api-token'
})

const patterns = await client.patterns.list()
const violations = await client.violations.list({ status: 'open' })
```

## Best Practices

1. **Always include `X-Request-ID`** for request tracing
2. **Implement exponential backoff** for failed requests
3. **Cache responses** with appropriate TTLs
4. **Monitor rate limits** and adjust request frequency
5. **Use pagination** for large datasets
6. **Handle errors gracefully** with appropriate retry logic

## Versioning

Current API version: `v1`

Versioning strategy:
- Breaking changes increment major version
- New features increment minor version
- Patches increment patch version

---

**Last Updated**: 2025-12-09
**API Version**: 1.0
