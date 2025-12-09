/**
 * Pattern Compliance Dashboard - Approvals API Routes
 * GET  /api/pattern-compliance/approvals - List all approvals with filters
 * GET  /api/pattern-compliance/approvals?userId=X - Get approvals for specific user
 */

import { NextRequest, NextResponse } from "next/server";
import { createPatternComplianceDB } from "@/src/db/pattern-compliance/client";

/**
 * GET /api/pattern-compliance/approvals
 * List approvals with optional filters
 *
 * Query parameters:
 * - status: Filter by approval status (pending, approved, rejected)
 * - approverId: Filter by approver ID
 * - violationId: Filter by violation ID
 * - repositoryId: Filter by repository ID
 * - userId: Get approvals for specific user (overrides other filters)
 * - limit: Maximum number of results (default: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Special query parameters:
 * - userId={id} - Get all approvals assigned to this user
 * - status=pending - Get only pending approvals
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const db = createPatternComplianceDB(
      (request as any).env?.PATTERN_COMPLIANCE_DB
    );

    // Check for user-specific query
    const userId = searchParams.get("userId");

    if (userId) {
      // Get approvals for specific user
      const approvals = await db.getApprovalsForUser(userId, {
        status: searchParams.get("status") || undefined,
        limit: searchParams.get("limit")
          ? parseInt(searchParams.get("limit")!)
          : undefined,
        offset: searchParams.get("offset")
          ? parseInt(searchParams.get("offset")!)
          : undefined,
      });

      return NextResponse.json(
        {
          success: true,
          data: approvals,
          count: approvals.length,
          userId,
        },
        { status: 200 }
      );
    }

    // General list with filters
    const approvals = await db.listApprovals({
      status: searchParams.get("status") || undefined,
      approverId: searchParams.get("approverId") || undefined,
      violationId: searchParams.get("violationId") || undefined,
      repositoryId: searchParams.get("repositoryId") || undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 100,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
    });

    return NextResponse.json(
      {
        success: true,
        data: approvals,
        count: approvals.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error listing approvals:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list approvals",
      },
      { status: 500 }
    );
  }
}
