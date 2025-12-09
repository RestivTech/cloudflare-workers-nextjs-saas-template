/**
 * Pattern Compliance Dashboard - Repository API Routes
 * GET    /api/pattern-compliance/repositories        - List repositories
 * POST   /api/pattern-compliance/repositories        - Create repository
 * GET    /api/pattern-compliance/repositories/[id]   - Get repository by ID
 * PUT    /api/pattern-compliance/repositories/[id]   - Update repository
 * DELETE /api/pattern-compliance/repositories/[id]   - Delete repository
 */

import { NextRequest, NextResponse } from "next/server";
import { createPatternComplianceDB } from "@/src/db/pattern-compliance/client";
import type { RepositoryInsert } from "@/src/db/pattern-compliance/drizzle-schema";

/**
 * GET /api/pattern-compliance/repositories
 * List repositories with optional filters
 *
 * Query parameters:
 * - ownerTeam: Filter by team ID
 * - scanFrequency: Filter by scan frequency (manual, daily, weekly, monthly)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const db = createPatternComplianceDB(
      (request as any).env?.PATTERN_COMPLIANCE_DB
    );

    const filters = {
      ownerTeam: searchParams.get("ownerTeam") || undefined,
      scanFrequency: searchParams.get("scanFrequency") || undefined,
    };

    const repositories = await db.listRepositories(filters);

    return NextResponse.json(
      {
        success: true,
        data: repositories,
        count: repositories.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error listing repositories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list repositories",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pattern-compliance/repositories
 * Create a new repository
 *
 * Request body:
 * {
 *   "name": "Repository Name",
 *   "url": "https://github.com/owner/repo",
 *   "ownerTeam": "team-id",
 *   "patterns": ["pattern-id-1", "pattern-id-2"],
 *   "scanFrequency": "manual|daily|weekly|monthly",
 *   "isPublic": true,
 *   "autoCreateTickets": false,
 *   "ticketSystem": "github",
 *   "createdBy": "user-id"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = createPatternComplianceDB(
      (request as any).env?.PATTERN_COMPLIANCE_DB
    );

    // Validate required fields
    const requiredFields = ["name", "url"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Check for duplicate repository URL
    const existingRepository = await db.getRepositoryByUrl(body.url);
    if (existingRepository) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository with this URL already exists",
        },
        { status: 409 }
      );
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format",
        },
        { status: 400 }
      );
    }

    const repositoryData: RepositoryInsert = {
      id: body.id,
      name: body.name,
      url: body.url,
      owner_team: body.ownerTeam,
      patterns: body.patterns || [],
      scan_frequency: body.scanFrequency || "manual",
      is_public: body.isPublic !== undefined ? body.isPublic : true,
      auto_create_tickets: body.autoCreateTickets || false,
      ticket_system: body.ticketSystem,
      created_by: body.createdBy,
    };

    const repository = await db.createRepository(repositoryData);

    // Log audit entry
    await db.logAudit({
      action: "repository_created",
      resourceType: "repository",
      resourceId: repository?.id,
      userId: body.createdBy,
      details: { name: body.name, url: body.url },
    });

    return NextResponse.json(
      {
        success: true,
        data: repository,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating repository:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create repository",
      },
      { status: 500 }
    );
  }
}
