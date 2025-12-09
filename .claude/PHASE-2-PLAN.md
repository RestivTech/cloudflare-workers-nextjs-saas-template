# Phase 2: Frontend Dashboard UI - Implementation Plan

**Status**: Planning
**Date**: 2025-12-08
**Scope**: Pattern Compliance Dashboard Web Interface

---

## Overview

Phase 2 focuses on building a comprehensive web dashboard to consume the backend APIs created in Phase 1. The dashboard will provide interfaces for:
- Pattern management
- Repository configuration
- Violation tracking and remediation
- Approval workflow
- Admin controls and audit logs

---

## Architecture & Technology Stack

### Frontend Framework
- **Framework**: Next.js 15 App Router
- **UI Components**: Shadcn/UI (built on Radix UI + Tailwind CSS)
- **Forms**: React Hook Form + Zod (validation)
- **State Management**: React Query (TanStack Query) for server state
- **Server Actions**: Next.js Server Actions for mutations
- **Styling**: Tailwind CSS

### Layout Structure
```
src/app/
├── (dashboard)/
│   ├── layout.tsx              # Dashboard wrapper with nav
│   ├── page.tsx                # Dashboard home/overview
│   ├── patterns/
│   │   ├── page.tsx            # Pattern list
│   │   └── [id]/
│   │       └── page.tsx        # Pattern detail/edit
│   ├── repositories/
│   │   ├── page.tsx            # Repository list
│   │   └── [id]/
│   │       └── page.tsx        # Repository detail/edit
│   ├── violations/
│   │   ├── page.tsx            # Violation list
│   │   └── [id]/
│   │       └── page.tsx        # Violation detail
│   ├── approvals/
│   │   ├── page.tsx            # Approvals queue
│   │   └── history/
│   │       └── page.tsx        # Approval history
│   └── admin/
│       ├── page.tsx            # Admin dashboard
│       └── audit-log/
│           └── page.tsx        # Audit log viewer
├── api/
│   └── [existing endpoints]    # Already implemented
└── error.tsx                   # Error boundary
```

---

## Component Architecture

### Shared Components (`src/components/`)

**Layout Components**
- `DashboardNav` - Main navigation sidebar
- `DashboardHeader` - Top header with breadcrumbs
- `PageLayout` - Standard page wrapper

**Data Display Components**
- `DataTable` - Reusable table with sorting/filtering
- `Pagination` - Page navigation
- `StatusBadge` - Status indicators (pending, approved, etc.)
- `SLABadge` - SLA status (on-track, due-soon, overdue)
- `SeverityBadge` - Severity levels (Critical, High, Medium, Low)

**Form Components**
- `FormField` - Wrapper for form inputs with validation
- `PatternForm` - Pattern creation/editing form
- `RepositoryForm` - Repository configuration form
- `ApprovalForm` - Approval decision form

**Dialog/Modal Components**
- `ConfirmDialog` - Delete/action confirmation
- `ViolationDetailsModal` - Show violation details
- `CodeSnippetViewer` - Display code with syntax highlighting

**Feature Components**
- `ViolationList` - Filtered violation display
- `ApprovalQueue` - Pending approvals for user
- `AuditLogViewer` - Audit log with filtering

---

## Milestone Structure

### Milestone 1.6: Dashboard Setup & Pattern Management (Week 5)
**Duration**: 3-4 days
**Deliverables**: Pattern management UI

#### Tasks
1. **Project Setup**
   - [ ] Create dashboard layout structure
   - [ ] Setup shared components and utilities
   - [ ] Configure React Query
   - [ ] Create hooks for API data fetching

2. **Pattern List Page** (`/patterns`)
   - [ ] Display patterns in table format
   - [ ] Add filtering (category, status, severity)
   - [ ] Add sorting by name, severity, date
   - [ ] Show pattern details on row click
   - [ ] Implement create new pattern button

3. **Pattern Form Components**
   - [ ] Create pattern form with Zod validation
   - [ ] Pattern metadata fields (name, description, category)
   - [ ] Detection method selector
   - [ ] File patterns editor (JSON array)
   - [ ] Remediation guidance editor

4. **Pattern Detail Page** (`/patterns/[id]`)
   - [ ] Show full pattern information
   - [ ] Edit button → show form
   - [ ] Delete button → confirmation dialog
   - [ ] Show violation count for pattern
   - [ ] Display when pattern was created/updated

5. **API Integration**
   - [ ] Fetch patterns list with React Query
   - [ ] Create pattern server action
   - [ ] Update pattern server action
   - [ ] Delete pattern server action

---

### Milestone 1.7: Repository Management UI (Week 5)
**Duration**: 2-3 days
**Deliverables**: Repository configuration UI

#### Tasks
1. **Repository List Page** (`/repositories`)
   - [ ] Display repositories with status
   - [ ] Show last scan date/status
   - [ ] Add filtering by owner team
   - [ ] Implement create repository button

2. **Repository Form**
   - [ ] Git URL input with validation
   - [ ] Pattern selector (multi-select)
   - [ ] Scan frequency selector
   - [ ] GitHub PAT input (secure)
   - [ ] Auto-create tickets toggle

3. **Repository Detail Page** (`/repositories/[id]`)
   - [ ] Show repository info
   - [ ] Display scan history timeline
   - [ ] Edit repository settings
   - [ ] Delete repository confirmation
   - [ ] Test connection button (validate GitHub access)

4. **API Integration**
   - [ ] Fetch repositories with React Query
   - [ ] Create repository server action
   - [ ] Update repository server action
   - [ ] Delete repository server action

---

### Milestone 1.8: Violation Viewing & Remediation (Week 5-6)
**Duration**: 3-4 days
**Deliverables**: Violation management UI

#### Tasks
1. **Violation List Page** (`/violations`)
   - [ ] Display violations in table
   - [ ] Add filtering (status, severity, repository, pattern)
   - [ ] Add sorting (date, severity)
   - [ ] Show violation summary (counts by status)
   - [ ] Implement row click → detail view

2. **Violation Detail Page** (`/violations/[id]`)
   - [ ] Display violation details
   - [ ] Show code snippet with syntax highlighting
   - [ ] Display remediation guidance (markdown)
   - [ ] Show violation history/timeline
   - [ ] Show related violations (same pattern, file, repo)
   - [ ] Status update UI (open, resolved, suppressed, wontfix)
   - [ ] Approval status indicator with history

3. **API Integration**
   - [ ] Fetch violations with advanced filtering
   - [ ] Fetch violation by ID with full context
   - [ ] Update violation status server action
   - [ ] Fetch approval history

---

### Milestone 1.9: Email Approval Workflow (Week 6)
**Duration**: 3-4 days
**Deliverables**: Email approval system

#### Tasks
1. **Email Templates** (React Email)
   - [ ] Create approval request template
   - [ ] Create approval confirmation template
   - [ ] Template variables: violation details, approver info, deadline

2. **Resend Integration**
   - [ ] Configure Resend API
   - [ ] Send approval emails
   - [ ] Generate one-time approval tokens
   - [ ] Implement token validation

3. **Approval Link Handler**
   - [ ] Create approval confirmation page
   - [ ] Implement approve button (with token)
   - [ ] Implement reject button (with reason)
   - [ ] Update violation status via link
   - [ ] Log approval in audit trail

4. **API Integration**
   - [ ] Create approval server action
   - [ ] Create rejection server action
   - [ ] Send approval email server action

---

### Milestone 1.10: Approvals Queue & Admin (Week 6)
**Duration**: 3-4 days
**Deliverables**: Approval workflow UI and admin controls

#### Tasks
1. **Approvals Queue Page** (`/approvals`)
   - [ ] Display pending approvals for user
   - [ ] Show approval details (violation, due date, SLA status)
   - [ ] Add filtering (status: pending, approved, rejected)
   - [ ] Add sorting by due date
   - [ ] Implement approve/reject buttons
   - [ ] Show approval history

2. **Approval History Page** (`/approvals/history`)
   - [ ] Display all approvals (pending + completed)
   - [ ] Show decision timestamp and approver
   - [ ] Show decision reason
   - [ ] Filter by approver, decision type

3. **Admin Page** (`/admin`)
   - [ ] System settings UI
   - [ ] User/team management
   - [ ] Configure approval SLAs
   - [ ] Configure notification preferences

4. **Audit Log Viewer** (`/admin/audit-log`)
   - [ ] Display audit log entries
   - [ ] Filter by resource type, action, user
   - [ ] Show action details (what changed)
   - [ ] Export audit log

5. **API Integration**
   - [ ] Fetch approvals for current user
   - [ ] Fetch approval history
   - [ ] Approve violation server action
   - [ ] Reject violation server action
   - [ ] Fetch audit log entries

---

## Component Implementation Details

### Common Patterns

#### Data Fetching Hook
```typescript
// hooks/usePattern.ts
export function usePattern(id: string) {
  return useQuery({
    queryKey: ['pattern', id],
    queryFn: () => fetch(`/api/pattern-compliance/patterns/${id}`).then(r => r.json())
  })
}

export function usePatterns(filters?: PatternFilters) {
  return useQuery({
    queryKey: ['patterns', filters],
    queryFn: () => fetch(`/api/pattern-compliance/patterns?...`).then(r => r.json())
  })
}
```

#### Server Action Pattern
```typescript
// app/actions/patterns.ts
'use server'

export async function createPattern(data: PatternFormData) {
  const response = await fetch('/api/pattern-compliance/patterns', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create pattern')
  }

  return response.json()
}
```

#### Form Component Pattern
```typescript
// components/PatternForm.tsx
export function PatternForm({ pattern, onSubmit }: Props) {
  const form = useForm<PatternFormData>({
    resolver: zodResolver(patternSchema),
    defaultValues: pattern || defaults
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

---

## UI/UX Considerations

### Design System
- Use Shadcn/UI components for consistency
- Follow Tailwind CSS spacing and colors
- Implement light/dark mode support

### Accessibility
- ARIA labels for form fields
- Keyboard navigation for tables
- Focus indicators visible
- Color not only indicator (add icons/text for status)

### Performance
- Lazy load pages using dynamic imports
- Paginate large lists
- Use React Query caching
- Implement optimistic updates where appropriate

### Loading States
- Show loading skeleton while fetching data
- Disable buttons during submission
- Show success/error toast messages
- Clear error messages with actionable advice

---

## Git Workflow

### Branch Structure
```
main (production)
├── develop (staging)
│   ├── feature/dashboard-setup
│   ├── feature/pattern-management
│   ├── feature/repository-management
│   ├── feature/violation-viewing
│   ├── feature/email-approvals
│   └── feature/approvals-queue
```

### Commit Pattern
```
feat(dashboard): add pattern list page
docs(dashboard): add Phase 2 implementation plan
fix(forms): add proper error handling to pattern form
```

---

## Testing Strategy

### Unit Tests
- Form validation
- Data formatting utilities
- Custom hooks

### Integration Tests
- API data fetching
- Form submission flows
- Server actions

### E2E Tests
- Pattern creation workflow
- Approval workflow
- Complete user journey

---

## Success Metrics

### Milestone 1.6 (Pattern Management)
- ✅ Can list all patterns with filtering
- ✅ Can create pattern with form validation
- ✅ Can edit existing pattern
- ✅ Can delete pattern with confirmation
- ✅ Form shows proper error messages

### Milestone 1.7 (Repository Management)
- ✅ Can list repositories with status
- ✅ Can create repository with validation
- ✅ Can edit repository settings
- ✅ Scan history timeline visible
- ✅ GitHub connection validated

### Milestone 1.8 (Violation Management)
- ✅ Can list violations with filtering
- ✅ Can view violation details
- ✅ Code snippets display with syntax highlighting
- ✅ Can update violation status
- ✅ Related violations suggested

### Milestone 1.9 (Email Approvals)
- ✅ Approval emails send successfully
- ✅ Email links clickable and functional
- ✅ Can approve/reject without login
- ✅ Status updates in real-time

### Milestone 1.10 (Approvals Queue)
- ✅ Show pending approvals for user
- ✅ SLA status calculated correctly
- ✅ Can approve/reject in-app
- ✅ Audit log records all actions

---

## Dependencies & Libraries

### Already Available
- Next.js 15
- React 19
- Tailwind CSS
- TypeScript

### To Install
- `shadcn-ui` - Component library
- `react-hook-form` - Form state management
- `zod` - Validation schema
- `@tanstack/react-query` - Server state management
- `react-syntax-highlighter` - Code highlighting
- `react-markdown` - Markdown rendering
- `react-email` - Email templates (if email approval added)
- `lucide-react` - Icons
- `sonner` - Toast notifications
- `date-fns` - Date formatting

---

## Implementation Order

**Week 5**:
1. Dashboard setup (layouts, shared components)
2. Pattern management (list, form, CRUD)
3. Repository management (list, form, CRUD)

**Week 5-6**:
4. Violation viewing (list, detail, remediation)
5. Email approvals (templates, Resend integration)

**Week 6**:
6. Approvals queue (dashboard, history, admin)
7. Testing and refinement

---

## Next Steps

1. **Immediate**:
   - Install required npm packages
   - Create dashboard layout structure
   - Setup React Query configuration
   - Create reusable hooks and utilities

2. **This Week**:
   - Implement Pattern Management UI (Milestone 1.6)
   - Implement Repository Management UI (Milestone 1.7)

3. **Next Week**:
   - Implement Violation Management UI (Milestone 1.8)
   - Implement Email Approvals (Milestone 1.9)
   - Implement Approvals Queue (Milestone 1.10)

---

**Status**: Ready for Phase 2 Implementation
**Estimated Duration**: 2-3 weeks
**Complexity**: Medium (frontend UI with form handling and API integration)
