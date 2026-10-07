import { NextResponse } from "next/server";
import { providerRouter } from "@/lib/providers/provider-router";
import { GeoapifyProviderError } from "@/lib/providers/geoapify-provider";
import { LeadProviderSearchParams } from "@/lib/providers/types";
import { MIN_LEAD_COUNT, MAX_LEAD_COUNT } from "@/lib/search/limits";

type RequestBody = Partial<LeadProviderSearchParams>;

type ErrorCode =
  | "INVALID_REQUEST"
  | "PROVIDER_ERROR"
  | "INTERNAL_ERROR"
  | "GEOCODING_ERROR"
  | "PROVIDER_AUTH_ERROR"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_HTTP_ERROR"
  | "PROVIDER_MALFORMED_RESPONSE"
  | "PROVIDER_EMPTY_RESULT"
  | "NETWORK_ERROR";

function errorResponse(
  code: ErrorCode,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

function isRequestBody(value: unknown): value is RequestBody {
  return typeof value === "object" && value !== null;
}

function validateRequest(body: RequestBody): string | null {
  if (
    typeof body.businessType !== "string" ||
    body.businessType.trim().length < 1 ||
    body.businessType.trim().length > 100
  ) {
    return "businessType must be a non-empty string no longer than 100 characters.";
  }

  if (
    typeof body.location !== "string" ||
    body.location.trim().length < 1 ||
    body.location.trim().length > 200
  ) {
    return "location must be a non-empty string no longer than 200 characters.";
  }

  if (
    typeof body.limit !== "number" ||
    !Number.isInteger(body.limit) ||
    body.limit < MIN_LEAD_COUNT ||
    body.limit > MAX_LEAD_COUNT
  ) {
    return `limit must be an integer between ${MIN_LEAD_COUNT} and ${MAX_LEAD_COUNT}.`;
  }

  if (
    body.offset !== undefined &&
    (typeof body.offset !== "number" ||
      !Number.isInteger(body.offset) ||
      body.offset < 0)
  ) {
    return "offset must be a non-negative integer when provided.";
  }

  if (body.brief !== undefined) {
    if (typeof body.brief !== "object" || body.brief === null) {
      return "brief must be an object when provided.";
    }
    if (body.brief.resultCount !== undefined && (typeof body.brief.resultCount !== "number" || !Number.isInteger(body.brief.resultCount) || body.brief.resultCount < MIN_LEAD_COUNT || body.brief.resultCount > MAX_LEAD_COUNT)) {
      return `brief.resultCount must be an integer between ${MIN_LEAD_COUNT} and ${MAX_LEAD_COUNT}.`;
    }
    if (body.brief.goal !== undefined && (typeof body.brief.goal !== "string" || body.brief.goal.length > 300)) {
      return "brief.goal must be a string no longer than 300 characters.";
    }
    if (body.brief.additionalInstruction !== undefined && (typeof body.brief.additionalInstruction !== "string" || body.brief.additionalInstruction.length > 1000)) {
      return "brief.additionalInstruction must be a string no longer than 1000 characters.";
    }
    if (body.brief.priorities !== undefined && (!Array.isArray(body.brief.priorities) || body.brief.priorities.some((item) => typeof item !== "string" || item.length > 100))) {
      return "brief.priorities must be an array of short strings.";
    }
    if (body.brief.qualificationStyle !== undefined && !["broad", "balanced", "strict"].includes(body.brief.qualificationStyle)) {
      return "brief.qualificationStyle is invalid.";
    }
  }

  return null;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(
      "INVALID_REQUEST",
      "Request body must be valid JSON.",
      400
    );
  }

  if (!isRequestBody(body)) {
    return errorResponse(
      "INVALID_REQUEST",
      "Request body must be a JSON object.",
      400
    );
  }

  const validationError = validateRequest(body);
  if (validationError) {
    return errorResponse("INVALID_REQUEST", validationError, 400);
  }

  const params: LeadProviderSearchParams = {
    businessType: body.businessType!.trim(),
    location: body.location!.trim(),
    limit: body.limit!,
    offset: body.offset,
    brief: body.brief,
  };

  try {
    const result = await providerRouter.search(params);

    return NextResponse.json({
      provider: result.provider,
      results: result.leads,
      meta: {
        count: result.leads.length,
        offset: params.offset ?? 0,
      },
    });
  } catch (error) {
    if (error instanceof GeoapifyProviderError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[LeadProvider] request failed", {
          category: error.code,
          statusCode: error.statusCode,
        });
      }
      return errorResponse(
        error.code,
        error.publicMessage,
        error.statusCode
      );
    }

    return errorResponse(
      "PROVIDER_ERROR",
      "The lead provider could not complete this search.",
      502
    );
  }
}
