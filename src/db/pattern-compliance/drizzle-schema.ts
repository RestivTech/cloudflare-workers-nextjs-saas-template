/**
 * Pattern Compliance Dashboard - Drizzle ORM Schema
 * Generated from schema.sql
 */

import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  unique,
  index,
  check,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// ============================================================================
// CORE TABLES
// ============================================================================

export const patternsTable = sqliteTable(
  "patterns",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    category: text("category", {
      enum: ["Security", "Architecture", "CodeStyle", "Performance", "Testing"],
    }).notNull(),
    severity: text("severity", {
      enum: ["Critical", "High", "Medium", "Low"],
    }).notNull(),
    status: text("status", {
      enum: ["active", "deprecated", "archived"],
    }).default("active"),

    // Detection Configuration
    detectionMethod: text("detection_method", {
      enum: ["regex", "ast", "custom"],
    }).notNull(),
    detectionConfig: text("detection_config", { mode: "json" }).notNull(),
    filePatterns: text("file_patterns", { mode: "json" })
      .default("[]")
      .notNull(),
    exclusionPatterns: text("exclusion_patterns", { mode: "json" })
      .default("[]")
      .notNull(),

    // Remediation
    remediationGuidance: text("remediation_guidance"),
    remediationLink: text("remediation_link"),

    // Metadata
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    createdBy: text("created_by"),
    version: text("version").default("1.0"),
  },
  (table) => [
    index("idx_patterns_name").on(table.name),
    index("idx_patterns_category").on(table.category),
    index("idx_patterns_status").on(table.status),
  ]
);

export const repositoriesTable = sqliteTable(
  "repositories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    url: text("url").notNull().unique(),
    ownerTeam: text("owner_team"),

    // Scanning Configuration
    patterns: text("patterns", { mode: "json" }).default("[]").notNull(),
    scanFrequency: text("scan_frequency", {
      enum: ["manual", "daily", "weekly", "monthly"],
    }).default("manual"),
    lastScanAt: text("last_scan_at"),
    lastScanStatus: text("last_scan_status"),

    // GitHub Access
    githubTokenRef: text("github_token_ref"),
    isPublic: integer("is_public", { mode: "boolean" }).default(true),

    // Settings
    autoCreateTickets: integer("auto_create_tickets", { mode: "boolean" }).default(false),
    ticketSystem: text("ticket_system"),

    // Metadata
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    createdBy: text("created_by"),
  },
  (table) => [
    unique("idx_repos_url").on(table.url),
    index("idx_repos_owner_team").on(table.ownerTeam),
    index("idx_repos_scan_frequency").on(table.scanFrequency),
  ]
);

export const violationsTable = sqliteTable(
  "violations",
  {
    id: text("id").primaryKey(),
    repositoryId: text("repository_id")
      .notNull()
      .references(() => repositoriesTable.id),
    patternId: text("pattern_id")
      .notNull()
      .references(() => patternsTable.id),

    // Location
    filePath: text("file_path").notNull(),
    lineNumber: integer("line_number"),
    columnNumber: integer("column_number"),
    codeSnippet: text("code_snippet"),

    // Status
    status: text("status", {
      enum: ["open", "resolved", "suppressed", "wontfix"],
    }).default("open"),
    statusComment: text("status_comment"),

    // Remediation
    remediationAppliedAt: text("remediation_applied_at"),
    remediationAppliedBy: text("remediation_applied_by"),
    remediationLink: text("remediation_link"),

    // Approval
    approvalStatus: text("approval_status", {
      enum: ["pending", "approved", "rejected"],
    }).default("pending"),
    approvalRequiredLevel: text("approval_required_level"),
    approvalMethod: text("approval_method", {
      enum: ["email", "slack", "inapp"],
    }).default("email"),
    approverId: text("approver_id"),
    approvalDate: text("approval_date"),
    approvalReason: text("approval_reason"),

    // Metadata
    firstDetectedAt: text("first_detected_at").default(sql`CURRENT_TIMESTAMP`),
    lastSeenAt: text("last_seen_at").default(sql`CURRENT_TIMESTAMP`),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),

    // Severity
    severity: text("severity", {
      enum: ["Critical", "High", "Medium", "Low"],
    }),
  },
  (table) => [
    index("idx_violations_repo").on(table.repositoryId),
    index("idx_violations_pattern").on(table.patternId),
    index("idx_violations_status").on(table.status),
    index("idx_violations_approval_status").on(table.approvalStatus),
    index("idx_violations_severity").on(table.severity),
    index("idx_violations_first_detected").on(table.firstDetectedAt),
  ]
);

export const approvalsTable = sqliteTable(
  "approvals",
  {
    id: text("id").primaryKey(),
    violationId: text("violation_id")
      .notNull()
      .references(() => violationsTable.id),

    // Approval Flow
    approvalStep: integer("approval_step").default(1),
    approverId: text("approver_id").notNull(),
    assignedAt: text("assigned_at").default(sql`CURRENT_TIMESTAMP`),
    dueAt: text("due_at"),

    // Response
    status: text("status", {
      enum: ["pending", "approved", "rejected"],
    }).default("pending"),
    response: text("response"),
    responseAt: text("response_at"),
    responseMethod: text("response_method"),

    // Notification
    notificationSentAt: text("notification_sent_at"),
    notificationMethod: text("notification_method", {
      enum: ["email", "slack", "inapp"],
    }).notNull(),
    notificationStatus: text("notification_status"),

    // Metadata
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_approvals_violation").on(table.violationId),
    index("idx_approvals_approver").on(table.approverId),
    index("idx_approvals_status").on(table.status),
    index("idx_approvals_assigned_at").on(table.assignedAt),
  ]
);

export const auditLogTable = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    userId: text("user_id"),
    userEmail: text("user_email"),
    details: text("details", { mode: "json" }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_audit_resource").on(table.resourceType, table.resourceId),
    index("idx_audit_user").on(table.userId),
    index("idx_audit_action").on(table.action),
    index("idx_audit_created").on(table.createdAt),
  ]
);

// ============================================================================
// REFERENCE TABLES
// ============================================================================

export const usersTable = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    role: text("role", {
      enum: ["admin", "reviewer", "developer", "viewer"],
    }).notNull(),
    teamId: text("team_id").references(() => teamsTable.id),

    // Preferences
    notificationEmail: text("notification_email"),
    approvalSlackUserId: text("approval_slack_user_id"),

    // Metadata
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    lastLoginAt: text("last_login_at"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
  },
  (table) => [
    index("idx_users_email").on(table.email),
    index("idx_users_team").on(table.teamId),
    index("idx_users_role").on(table.role),
  ]
);

export const teamsTable = sqliteTable(
  "teams",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),

    // Permissions
    repositories: text("repositories", { mode: "json" }).default("[]"),
    patterns: text("patterns", { mode: "json" }).default("[]"),

    // Approval Settings
    requiresApproval: integer("requires_approval", { mode: "boolean" }).default(true),
    defaultApprovalMethod: text("default_approval_method", {
      enum: ["email", "slack", "inapp"],
    }).default("email"),
    approvalSlaHours: integer("approval_sla_hours").default(24),

    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_teams_name").on(table.name),
  ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const patternsRelations = relations(patternsTable, ({ many }) => ({
  violations: many(violationsTable),
}));

export const repositoriesRelations = relations(repositoriesTable, ({ many }) => ({
  violations: many(violationsTable),
}));

export const violationsRelations = relations(violationsTable, ({ one, many }) => ({
  pattern: one(patternsTable, {
    fields: [violationsTable.patternId],
    references: [patternsTable.id],
  }),
  repository: one(repositoriesTable, {
    fields: [violationsTable.repositoryId],
    references: [repositoriesTable.id],
  }),
  approvals: many(approvalsTable),
}));

export const approvalsRelations = relations(approvalsTable, ({ one }) => ({
  violation: one(violationsTable, {
    fields: [approvalsTable.violationId],
    references: [violationsTable.id],
  }),
  approver: one(usersTable, {
    fields: [approvalsTable.approverId],
    references: [usersTable.id],
  }),
}));

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  team: one(teamsTable, {
    fields: [usersTable.teamId],
    references: [teamsTable.id],
  }),
  approvalsGiven: many(approvalsTable),
}));

export const teamsRelations = relations(teamsTable, ({ many }) => ({
  users: many(usersTable),
}));

// ============================================================================
// TYPES
// ============================================================================

export type Pattern = typeof patternsTable.$inferSelect;
export type PatternInsert = typeof patternsTable.$inferInsert;

export type Repository = typeof repositoriesTable.$inferSelect;
export type RepositoryInsert = typeof repositoriesTable.$inferInsert;

export type Violation = typeof violationsTable.$inferSelect;
export type ViolationInsert = typeof violationsTable.$inferInsert;

export type Approval = typeof approvalsTable.$inferSelect;
export type ApprovalInsert = typeof approvalsTable.$inferInsert;

export type AuditLog = typeof auditLogTable.$inferSelect;
export type AuditLogInsert = typeof auditLogTable.$inferInsert;

export type User = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;

export type Team = typeof teamsTable.$inferSelect;
export type TeamInsert = typeof teamsTable.$inferInsert;
