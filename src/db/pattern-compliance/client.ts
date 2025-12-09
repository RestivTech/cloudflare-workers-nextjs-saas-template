/**
 * Pattern Compliance Dashboard - Database Client
 * Provides typed access to D1 database with Drizzle ORM
 */

import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./drizzle-schema";

/**
 * Database client for Pattern Compliance Dashboard
 * Uses Drizzle ORM for type-safe queries
 */
export class PatternComplianceDB {
  private db: ReturnType<typeof drizzle>;

  constructor(database: D1Database) {
    this.db = drizzle(database, { schema });
  }

  /**
   * Get the underlying Drizzle instance for custom queries
   */
  getDb() {
    return this.db;
  }

  /**
   * Get Patterns table accessor
   */
  get patterns() {
    return this.db.query.patternsTable;
  }

  /**
   * Get Repositories table accessor
   */
  get repositories() {
    return this.db.query.repositoriesTable;
  }

  /**
   * Get Violations table accessor
   */
  get violations() {
    return this.db.query.violationsTable;
  }

  /**
   * Get Approvals table accessor
   */
  get approvals() {
    return this.db.query.approvalsTable;
  }

  /**
   * Get Audit Log table accessor
   */
  get auditLog() {
    return this.db.query.auditLogTable;
  }

  /**
   * Get Users table accessor
   */
  get users() {
    return this.db.query.usersTable;
  }

  /**
   * Get Teams table accessor
   */
  get teams() {
    return this.db.query.teamsTable;
  }

  /**
   * Execute initialization steps
   * - Create tables if they don't exist
   * - Seed initial data
   */
  async initialize(): Promise<void> {
    // Tables are created via migrations or schema SQL
    // This method can be used for post-deployment setup
    console.log("Pattern Compliance DB initialized");
  }

  /**
   * Health check - verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.db.select().from(schema.teamsTable).limit(1);
      return Array.isArray(result);
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  /**
   * Log audit entry
   */
  async logAudit({
    action,
    resourceType,
    resourceId,
    userId,
    userEmail,
    details,
  }: {
    action: string;
    resourceType?: string;
    resourceId?: string;
    userId?: string;
    userEmail?: string;
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      const id = crypto.randomUUID();
      await this.db.insert(schema.auditLogTable).values({
        id,
        action,
        resourceType,
        resourceId,
        userId,
        userEmail,
        details: details as any,
      });
    } catch (error) {
      console.error("Failed to log audit entry:", error);
      // Don't throw - audit logging should not break main operations
    }
  }

  /**
   * Get repository compliance metrics
   */
  async getRepositoryMetrics(repositoryId: string) {
    try {
      const result = await this.db.execute(
        `
        SELECT
          r.id,
          r.name,
          COUNT(DISTINCT v.id) as total_violations,
          COUNT(DISTINCT CASE WHEN v.status = 'open' THEN v.id END) as open_violations,
          COUNT(DISTINCT CASE WHEN v.status = 'resolved' THEN v.id END) as resolved_violations,
          COUNT(DISTINCT CASE WHEN v.severity = 'Critical' THEN v.id END) as critical_violations,
          ROUND(100.0 * COUNT(DISTINCT CASE WHEN v.status = 'resolved' THEN v.id END) /
                NULLIF(COUNT(DISTINCT v.id), 0), 2) as compliance_percentage
        FROM repositories r
        LEFT JOIN violations v ON r.id = v.repository_id
        WHERE r.id = ?
        GROUP BY r.id, r.name
        `,
        [repositoryId]
      );
      return result;
    } catch (error) {
      console.error("Failed to get repository metrics:", error);
      return null;
    }
  }

  /**
   * Get all pending approvals for a user
   */
  async getPendingApprovalsForUser(userId: string) {
    try {
      return await this.db.execute(
        `
        SELECT
          a.id as approval_id,
          v.id as violation_id,
          r.name as repository_name,
          p.name as pattern_name,
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
        WHERE a.approver_id = ? AND a.status = 'pending'
        ORDER BY a.due_at ASC
        `,
        [userId]
      );
    } catch (error) {
      console.error("Failed to get pending approvals:", error);
      return [];
    }
  }

  /**
   * Get violations for a pattern with optional filtering
   */
  async getViolationsForPattern(
    patternId: string,
    filters?: {
      status?: string;
      repositoryId?: string;
      severity?: string;
    }
  ) {
    try {
      let query = this.db
        .select()
        .from(schema.violationsTable)
        .where((v) => v.patternId === patternId);

      // TODO: Add filtering support using Drizzle conditions
      return query;
    } catch (error) {
      console.error("Failed to get violations:", error);
      return [];
    }
  }
}

/**
 * Create database client from Cloudflare context
 */
export function createPatternComplianceDB(
  database: D1Database
): PatternComplianceDB {
  return new PatternComplianceDB(database);
}

/**
 * Get database instance from Cloudflare context (for server actions)
 */
export async function getPatternComplianceDB() {
  // This should be called in Cloudflare Workers context
  // The database binding will be available through the worker environment
  throw new Error(
    "Use createPatternComplianceDB(database) in worker context instead"
  );
}
