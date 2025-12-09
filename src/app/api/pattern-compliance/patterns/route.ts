/**
 * Pattern Compliance Dashboard - Pattern API Routes
 * GET    /api/pattern-compliance/patterns        - List patterns
 * POST   /api/pattern-compliance/patterns        - Create pattern
 * GET    /api/pattern-compliance/patterns/[id]   - Get pattern by ID
 * PUT    /api/pattern-compliance/patterns/[id]   - Update pattern
 * DELETE /api/pattern-compliance/patterns/[id]   - Delete pattern
 */

import { NextRequest, NextResponse } from "next/server";
import { createPatternComplianceDB } from "@/src/db/pattern-compliance/client";
import type { PatternInsert } from "@/src/db/pattern-compliance/drizzle-schema";

/**
 * GET /api/pattern-compliance/patterns
 * List patterns with optional filters
 *
 * Query parameters:
 * - category: Filter by pattern category (Security, Architecture, CodeStyle, Performance, Testing)
 * - status: Filter by status (active, deprecated, archived)
 * - severity: Filter by severity (Critical, High, Medium, Low)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const db = createPatternComplianceDB(
      (request as any).env?.PATTERN_COMPLIANCE_DB
    );

    const filters = {
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      severity: searchParams.get("severity") || undefined,
    };

    const patterns = await db.listPatterns(filters);

    return NextResponse.json(
      {
        success: true,
        data: patterns,
        count: patterns.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error listing patterns:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list patterns",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pattern-compliance/patterns
 * Create a new pattern
 *
 * Request body:
 * {
 *   "name": "Pattern Name",
 *   "description": "Pattern description",
 *   "category": "Security|Architecture|CodeStyle|Performance|Testing",
 *   "severity": "Critical|High|Medium|Low",
 *   "detectionMethod": "regex|ast|custom",
 *   "detectionConfig": { ... },
 *   "filePatterns": ["*.ts", "*.js"],
 *   "exclusionPatterns": ["node_modules/**"],
 *   "remediationGuidance": "How to fix this pattern",
 *   "remediationLink": "https://...",
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
    const requiredFields = [
      "name",
      "category",
      "severity",
      "detectionMethod",
      "detectionConfig",
    ];
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

    // Check for duplicate pattern name
    const existingPattern = await db.getPatternByName(body.name);
    if (existingPattern) {
      return NextResponse.json(
        {
          success: false,
          error: "Pattern with this name already exists",
        },
        { status: 409 }
      );
    }

    const patternData: PatternInsert = {
      id: body.id,
      name: body.name,
      description: body.description,
      category: body.category,
      severity: body.severity,
      status: body.status || "active",
      detection_method: body.detectionMethod,
      detection_config: body.detectionConfig,
      file_patterns: body.filePatterns || [],
      exclusion_patterns: body.exclusionPatterns || [],
      remediation_guidance: body.remediationGuidance,
      remediation_link: body.remediationLink,
      created_by: body.createdBy,
      version: body.version || "1.0",
    };

    const pattern = await db.createPattern(patternData);

    // Log audit entry
    await db.logAudit({
      action: "pattern_created",
      resourceType: "pattern",
      resourceId: pattern?.id,
      userId: body.createdBy,
      details: { name: body.name, severity: body.severity },
    });

    return NextResponse.json(
      {
        success: true,
        data: pattern,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating pattern:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create pattern",
      },
      { status: 500 }
    );
  }
}
