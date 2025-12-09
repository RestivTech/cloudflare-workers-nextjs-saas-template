/**
 * Pattern Compliance Dashboard - Pattern by ID API Routes
 * GET    /api/pattern-compliance/patterns/[id]   - Get pattern by ID
 * PUT    /api/pattern-compliance/patterns/[id]   - Update pattern
 * DELETE /api/pattern-compliance/patterns/[id]   - Delete pattern
 */

import { NextRequest, NextResponse } from "next/server";
import { createPatternComplianceDB } from "@/src/db/pattern-compliance/client";
import type { PatternInsert } from "@/src/db/pattern-compliance/drizzle-schema";

/**
 * GET /api/pattern-compliance/patterns/[id]
 * Get a pattern by ID
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

    const pattern = await db.getPatternById(id);

    if (!pattern) {
      return NextResponse.json(
        {
          success: false,
          error: "Pattern not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: pattern,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting pattern:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get pattern",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pattern-compliance/patterns/[id]
 * Update a pattern
 *
 * Request body (all fields optional):
 * {
 *   "name": "Updated Name",
 *   "description": "Updated description",
 *   "status": "active|deprecated|archived",
 *   "detectionConfig": { ... },
 *   "filePatterns": ["*.ts"],
 *   "remediationGuidance": "Updated guidance"
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

    // Check if pattern exists
    const existingPattern = await db.getPatternById(id);
    if (!existingPattern) {
      return NextResponse.json(
        {
          success: false,
          error: "Pattern not found",
        },
        { status: 404 }
      );
    }

    // If name is being updated, check for duplicates
    if (body.name && body.name !== existingPattern.name) {
      const duplicatePattern = await db.getPatternByName(body.name);
      if (duplicatePattern) {
        return NextResponse.json(
          {
            success: false,
            error: "A pattern with this name already exists",
          },
          { status: 409 }
        );
      }
    }

    // Build update data from body
    const updateData: Partial<PatternInsert> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.severity !== undefined) updateData.severity = body.severity;
    if (body.detectionMethod !== undefined)
      updateData.detection_method = body.detectionMethod;
    if (body.detectionConfig !== undefined)
      updateData.detection_config = body.detectionConfig;
    if (body.filePatterns !== undefined)
      updateData.file_patterns = body.filePatterns;
    if (body.exclusionPatterns !== undefined)
      updateData.exclusion_patterns = body.exclusionPatterns;
    if (body.remediationGuidance !== undefined)
      updateData.remediation_guidance = body.remediationGuidance;
    if (body.remediationLink !== undefined)
      updateData.remediation_link = body.remediationLink;

    const updatedPattern = await db.updatePattern(id, updateData);

    // Log audit entry
    await db.logAudit({
      action: "pattern_updated",
      resourceType: "pattern",
      resourceId: id,
      userId: body.updatedBy,
      details: { changes: Object.keys(updateData) },
    });

    return NextResponse.json(
      {
        success: true,
        data: updatedPattern,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating pattern:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update pattern",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/pattern-compliance/patterns/[id]
 * Delete a pattern
 *
 * Note: This will fail if there are violations linked to this pattern
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

    // Check if pattern exists
    const pattern = await db.getPatternById(id);
    if (!pattern) {
      return NextResponse.json(
        {
          success: false,
          error: "Pattern not found",
        },
        { status: 404 }
      );
    }

    // Delete the pattern
    await db.deletePattern(id);

    // Log audit entry
    await db.logAudit({
      action: "pattern_deleted",
      resourceType: "pattern",
      resourceId: id,
      userId: body.deletedBy,
      details: { name: pattern.name },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pattern deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting pattern:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete pattern",
      },
      { status: 500 }
    );
  }
}
