/**
 * Pattern Compliance Dashboard - Approval Action Routes
 * POST /api/pattern-compliance/approvals/[violationId] - Approve or reject a violation
 * GET  /api/pattern-compliance/approvals/[violationId] - Get approval history for a violation
 */

import { NextRequest, NextResponse } from "next/server";
import { createPatternComplianceDB } from "@/src/db/pattern-compliance/client";

/**
 * GET /api/pattern-compliance/approvals/[violationId]
 * Get approval history for a specific violation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { violationId: string } }
) {
  try {
    const { violationId } = params;
    const db = createPatternComplianceDB(
      (request as any).env?.PATTERN_COMPLIANCE_DB
    );

    const history = await db.getApprovalHistory(violationId);

    return NextResponse.json(
      {
        success: true,
        data: history,
        violationId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting approval history:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get approval history",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pattern-compliance/approvals/[violationId]
 * Approve or reject a violation
 *
 * Request body:
 * {
 *   "action": "approve|reject",
 *   "approverId": "user-id",
 *   "decisionReason": "Optional reason for the decision"
 * }
 *
 * Query parameters (alternative to body):
 * - action=approve|reject
 * - approverId=user-id
 * - reason=optional-reason
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { violationId: string } }
) {
  try {
    const { violationId } = params;
    const body = await request.json();
    const db = createPatternComplianceDB(
      (request as any).env?.PATTERN_COMPLIANCE_DB
    );

    // Validate required fields
    if (!body.action || !body.approverId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: action, approverId",
        },
        { status: 400 }
      );
    }

    // Validate action
    if (!["approve", "reject"].includes(body.action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'approve' or 'reject'",
        },
        { status: 400 }
      );
    }

    let result;
    const decisionReason = body.decisionReason || body.reason;

    if (body.action === "approve") {
      result = await db.approveViolation(
        violationId,
        body.approverId,
        decisionReason
      );
    } else {
      result = await db.rejectViolation(
        violationId,
        body.approverId,
        decisionReason
      );
    }

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to ${body.action} violation`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Violation ${body.action}d successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing approval action:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process approval action",
      },
      { status: 500 }
    );
  }
}
