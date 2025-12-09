/**
 * Pattern Compliance Dashboard - Violations API Routes
 * GET /api/pattern-compliance/violations - List violations with filters
 * GET /api/pattern-compliance/violations?repositoryId=X - Get violations by repository
 * GET /api/pattern-compliance/violations?patternId=X - Get violations by pattern
 */

import { NextRequest, NextResponse } from "next/server";
import { createPatternComplianceDB } from "@/src/db/pattern-compliance/client";

/**
 * GET /api/pattern-compliance/violations
 * List violations with optional filters
 *
 * Query parameters:
 * - status: Filter by violation status (open, resolved, suppressed, wontfix)
 * - approvalStatus: Filter by approval status (pending, approved, rejected)
 * - severity: Filter by severity (Critical, High, Medium, Low)
 * - repositoryId: Filter by repository ID
 * - patternId: Filter by pattern ID
 * - limit: Maximum number of results (default: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Special query parameters:
 * - byRepository={id} - Get violations for specific repository
 * - byPattern={id} - Get violations for specific pattern
 * - awaitingApproval=true - Get violations pending approval
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const db = createPatternComplianceDB(
      (request as any).env?.PATTERN_COMPLIANCE_DB
    );

    // Check for special query parameters
    const byRepository = searchParams.get("byRepository");
    const byPattern = searchParams.get("byPattern");
    const awaitingApproval = searchParams.get("awaitingApproval") === "true";

    if (byRepository) {
      // Get violations for specific repository
      const violations = await db.getViolationsByRepository(byRepository, {
        status: searchParams.get("status") || undefined,
        severity: searchParams.get("severity") || undefined,
        limit: searchParams.get("limit")
          ? parseInt(searchParams.get("limit")!)
          : undefined,
      });

      return NextResponse.json(
        {
          success: true,
          data: violations,
          count: violations.length,
          repositoryId: byRepository,
        },
        { status: 200 }
      );
    }

    if (byPattern) {
      // Get violations for specific pattern
      const violations = await db.getViolationsByPattern(byPattern, {
        status: searchParams.get("status") || undefined,
        repositoryId: searchParams.get("repositoryId") || undefined,
        limit: searchParams.get("limit")
          ? parseInt(searchParams.get("limit")!)
          : undefined,
      });

      return NextResponse.json(
        {
          success: true,
          data: violations,
          count: violations.length,
          patternId: byPattern,
        },
        { status: 200 }
      );
    }

    if (awaitingApproval) {
      // Get violations awaiting approval
      const violations = await db.getViolationsAwaitingApproval({
        severity: searchParams.get("severity") || undefined,
        repositoryId: searchParams.get("repositoryId") || undefined,
        limit: searchParams.get("limit")
          ? parseInt(searchParams.get("limit")!)
          : undefined,
      });

      return NextResponse.json(
        {
          success: true,
          data: violations,
          count: violations.length,
          filter: "awaiting_approval",
        },
        { status: 200 }
      );
    }

    // General list with filters
    const violations = await db.listViolations({
      status: searchParams.get("status") || undefined,
      approvalStatus: searchParams.get("approvalStatus") || undefined,
      severity: searchParams.get("severity") || undefined,
      repositoryId: searchParams.get("repositoryId") || undefined,
      patternId: searchParams.get("patternId") || undefined,
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
        data: violations,
        count: violations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error listing violations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list violations",
      },
      { status: 500 }
    );
  }
}
