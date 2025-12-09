/**
 * Pattern Compliance Dashboard - Database Client
 * Provides typed access to D1 database with Drizzle ORM
 */

import { drizzle } from "drizzle-orm/d1";
import { eq, and, or } from "drizzle-orm";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./drizzle-schema";
import type {
  Pattern,
  PatternInsert,
  Repository,
  RepositoryInsert,
  Violation,
  ViolationInsert,
  Approval,
  ApprovalInsert,
  User,
  UserInsert,
  Team,
  TeamInsert,
} from "./drizzle-schema";

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

  // ============================================================================
  // PATTERN CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new pattern
   */
  async createPattern(data: PatternInsert): Promise<Pattern | null> {
    try {
      const id = data.id || crypto.randomUUID();
      const result = await this.db
        .insert(schema.patternsTable)
        .values({
          ...data,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error("Failed to create pattern:", error);
      throw error;
    }
  }

  /**
   * Get pattern by ID
   */
  async getPatternById(id: string): Promise<Pattern | undefined> {
    try {
      const result = await this.db
        .select()
        .from(schema.patternsTable)
        .where(eq(schema.patternsTable.id, id));

      return result[0];
    } catch (error) {
      console.error("Failed to get pattern:", error);
      return undefined;
    }
  }

  /**
   * Get pattern by name
   */
  async getPatternByName(name: string): Promise<Pattern | undefined> {
    try {
      const result = await this.db
        .select()
        .from(schema.patternsTable)
        .where(eq(schema.patternsTable.name, name));

      return result[0];
    } catch (error) {
      console.error("Failed to get pattern by name:", error);
      return undefined;
    }
  }

  /**
   * List all patterns with optional filters
   */
  async listPatterns(filters?: {
    category?: string;
    status?: string;
    severity?: string;
  }): Promise<Pattern[]> {
    try {
      let query = this.db.select().from(schema.patternsTable);

      if (filters?.category) {
        query = query.where(eq(schema.patternsTable.category, filters.category));
      }
      if (filters?.status) {
        query = query.where(eq(schema.patternsTable.status, filters.status));
      }
      if (filters?.severity) {
        query = query.where(eq(schema.patternsTable.severity, filters.severity));
      }

      return await query;
    } catch (error) {
      console.error("Failed to list patterns:", error);
      return [];
    }
  }

  /**
   * Update a pattern
   */
  async updatePattern(id: string, data: Partial<PatternInsert>): Promise<Pattern | null> {
    try {
      const result = await this.db
        .update(schema.patternsTable)
        .set({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .where(eq(schema.patternsTable.id, id))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error("Failed to update pattern:", error);
      throw error;
    }
  }

  /**
   * Delete a pattern
   */
  async deletePattern(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(schema.patternsTable)
        .where(eq(schema.patternsTable.id, id));

      return true;
    } catch (error) {
      console.error("Failed to delete pattern:", error);
      throw error;
    }
  }

  // ============================================================================
  // REPOSITORY CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new repository
   */
  async createRepository(data: RepositoryInsert): Promise<Repository | null> {
    try {
      const id = data.id || crypto.randomUUID();
      const result = await this.db
        .insert(schema.repositoriesTable)
        .values({
          ...data,
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error("Failed to create repository:", error);
      throw error;
    }
  }

  /**
   * Get repository by ID
   */
  async getRepositoryById(id: string): Promise<Repository | undefined> {
    try {
      const result = await this.db
        .select()
        .from(schema.repositoriesTable)
        .where(eq(schema.repositoriesTable.id, id));

      return result[0];
    } catch (error) {
      console.error("Failed to get repository:", error);
      return undefined;
    }
  }

  /**
   * Get repository by URL
   */
  async getRepositoryByUrl(url: string): Promise<Repository | undefined> {
    try {
      const result = await this.db
        .select()
        .from(schema.repositoriesTable)
        .where(eq(schema.repositoriesTable.url, url));

      return result[0];
    } catch (error) {
      console.error("Failed to get repository by URL:", error);
      return undefined;
    }
  }

  /**
   * List all repositories with optional filters
   */
  async listRepositories(filters?: {
    ownerTeam?: string;
    scanFrequency?: string;
  }): Promise<Repository[]> {
    try {
      let query = this.db.select().from(schema.repositoriesTable);

      if (filters?.ownerTeam) {
        query = query.where(eq(schema.repositoriesTable.ownerTeam, filters.ownerTeam));
      }
      if (filters?.scanFrequency) {
        query = query.where(eq(schema.repositoriesTable.scanFrequency, filters.scanFrequency));
      }

      return await query;
    } catch (error) {
      console.error("Failed to list repositories:", error);
      return [];
    }
  }

  /**
   * Update a repository
   */
  async updateRepository(id: string, data: Partial<RepositoryInsert>): Promise<Repository | null> {
    try {
      const result = await this.db
        .update(schema.repositoriesTable)
        .set({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .where(eq(schema.repositoriesTable.id, id))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error("Failed to update repository:", error);
      throw error;
    }
  }

  /**
   * Delete a repository
   */
  async deleteRepository(id: string): Promise<boolean> {
    try {
      await this.db
        .delete(schema.repositoriesTable)
        .where(eq(schema.repositoriesTable.id, id));

      return true;
    } catch (error) {
      console.error("Failed to delete repository:", error);
      throw error;
    }
  }

  // ============================================================================
  // USER CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new user
   */
  async createUser(data: UserInsert): Promise<User | null> {
    try {
      const id = data.id || crypto.randomUUID();
      const result = await this.db
        .insert(schema.usersTable)
        .values({
          ...data,
          id,
          created_at: new Date().toISOString(),
        })
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | undefined> {
    try {
      const result = await this.db
        .select()
        .from(schema.usersTable)
        .where(eq(schema.usersTable.id, id));

      return result[0];
    } catch (error) {
      console.error("Failed to get user:", error);
      return undefined;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await this.db
        .select()
        .from(schema.usersTable)
        .where(eq(schema.usersTable.email, email));

      return result[0];
    } catch (error) {
      console.error("Failed to get user by email:", error);
      return undefined;
    }
  }

  /**
   * List users by team
   */
  async listUsersByTeam(teamId: string): Promise<User[]> {
    try {
      return await this.db
        .select()
        .from(schema.usersTable)
        .where(eq(schema.usersTable.teamId, teamId));
    } catch (error) {
      console.error("Failed to list users by team:", error);
      return [];
    }
  }

  /**
   * Update a user
   */
  async updateUser(id: string, data: Partial<UserInsert>): Promise<User | null> {
    try {
      const result = await this.db
        .update(schema.usersTable)
        .set(data)
        .where(eq(schema.usersTable.id, id))
        .returning();

      return result[0] || null;
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
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
