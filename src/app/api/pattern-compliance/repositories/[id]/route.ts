/**
 * Pattern Compliance Dashboard - Repository by ID API Routes
 * GET    /api/pattern-compliance/repositories/[id]   - Get repository by ID
 * PUT    /api/pattern-compliance/repositories/[id]   - Update repository
 * DELETE /api/pattern-compliance/repositories/[id]   - Delete repository
 */

import { NextRequest, NextResponse } from "next/server";
import { createPatternComplianceDB } from "@/src/db/pattern-compliance/client";
import type { RepositoryInsert } from "@/src/db/pattern-compliance/drizzle-schema";

/**
 * GET /api/pattern-compliance/repositories/[id]
 * Get a repository by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = createPatternComplianceDB(
      (request as any).env?.PATTERN_COMPLIANCE_DB
    );

    const repository = await db.getRepositoryById(id);

    if (!repository) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: repository,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting repository:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get repository",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pattern-compliance/repositories/[id]
 * Update a repository
 *
 * Request body (all fields optional):
 * {
 *   "name": "Updated Name",
 *   "url": "https://github.com/owner/new-repo",
 *   "patterns": ["pattern-id-1"],
 *   "scanFrequency": "daily",
 *   "lastScanStatus": "success|failure",
 *   "autoCreateTickets": true
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const db = createPatternComplianceDB(
      (request as any).env?.PATTERN_COMPLIANCE_DB
    );

    // Check if repository exists
    const existingRepository = await db.getRepositoryById(id);
    if (!existingRepository) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository not found",
        },
        { status: 404 }
      );
    }

    // If URL is being updated, check for duplicates
    if (body.url && body.url !== existingRepository.url) {
      const duplicateRepository = await db.getRepositoryByUrl(body.url);
      if (duplicateRepository) {
        return NextResponse.json(
          {
            success: false,
            error: "A repository with this URL already exists",
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
    }

    // Build update data from body
    const updateData: Partial<RepositoryInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.ownerTeam !== undefined) updateData.owner_team = body.ownerTeam;
    if (body.patterns !== undefined) updateData.patterns = body.patterns;
    if (body.scanFrequency !== undefined)
      updateData.scan_frequency = body.scanFrequency;
    if (body.lastScanAt !== undefined)
      updateData.last_scan_at = body.lastScanAt;
    if (body.lastScanStatus !== undefined)
      updateData.last_scan_status = body.lastScanStatus;
    if (body.autoCreateTickets !== undefined)
      updateData.auto_create_tickets = body.autoCreateTickets;
    if (body.ticketSystem !== undefined)
      updateData.ticket_system = body.ticketSystem;

    const updatedRepository = await db.updateRepository(id, updateData);

    // Log audit entry
    await db.logAudit({
      action: "repository_updated",
      resourceType: "repository",
      resourceId: id,
      userId: body.updatedBy,
      details: { changes: Object.keys(updateData) },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedRepository,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating repository:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update repository",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pattern-compliance/repositories/[id]
 * Delete a repository
 *
 * Note: This will fail if there are violations linked to this repository
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const db = createPatternComplianceDB(
      (request as any).env?.PATTERN_COMPLIANCE_DB
    );

    // Check if repository exists
    const repository = await db.getRepositoryById(id);
    if (!repository) {
      return NextResponse.json(
        {
          success: false,
          error: "Repository not found",
        },
        { status: 404 }
      );
    }

    // Delete the repository
    await db.deleteRepository(id);

    // Log audit entry
    await db.logAudit({
      action: "repository_deleted",
      resourceType: "repository",
      resourceId: id,
      userId: body.deletedBy,
      details: { name: repository.name, url: repository.url },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Repository deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting repository:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete repository",
      },
      { status: 500 }
    );
  }
}
