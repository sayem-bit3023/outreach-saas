import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return response({ error: { message: "Usage service is not configured." } }, 503);
  }

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) {
    return response({ error: { message: "Please sign in to view usage." } }, 401);
  }

  const { data, error } = await supabase.rpc("get_discovery_usage");
  if (error) {
    return response({ error: { message: "Usage could not be loaded." } }, 503);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return response({ error: { message: "Usage could not be loaded." } }, 503);
  }

  return response({
    used: Number(row.used_count),
    reserved: Number(row.reserved_count),
    remaining: Number(row.remaining_count),
    limit: Number(row.lifetime_limit),
    plan: "free",
  });
}
