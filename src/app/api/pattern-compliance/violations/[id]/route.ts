/**
 * Pattern Compliance Dashboard - Violations by ID API Routes
 * GET    /api/pattern-compliance/violations/[id] - Get violation by ID
 * PUT    /api/pattern-compliance/violations/[id] - Update violation status
 */

import { NextRequest, NextResponse } from "next/server";
import { createPatternComplianceDB } from "@/src/db/pattern-compliance/client";

/**
 * GET /api/pattern-compliance/violations/[id]
 * Get a violation by ID with full context
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

    const violation = await db.getViolationById(id);

    if (!violation || violation.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Violation not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: violation[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting violation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get violation",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pattern-compliance/violations/[id]
 * Update violation status
 *
 * Request body:
 * {
 *   "status": "open|resolved|suppressed|wontfix",
 *   "statusComment": "Why this status was set",
 *   "updatedBy": "user-id"
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

    // Validate status
    const validStatuses = ["open", "resolved", "suppressed", "wontfix"];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Update the violation status
    const updatedViolation = await db.updateViolationStatus(id, {
      status: body.status,
      statusComment: body.statusComment,
      updatedBy: body.updatedBy,
    });

    if (!updatedViolation) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update violation",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedViolation,
        message: `Violation status updated to ${body.status}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating violation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update violation",
      },
      { status: 500 }
    );
  }
}
