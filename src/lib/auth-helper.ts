import { createServiceClient } from "@/lib/supabase/service";

// Fixed user ID for personal use (no auth required)
const PERSONAL_USER_ID = "00000000-0000-0000-0000-000000000001";

export function getSupabase() {
  return createServiceClient();
}

export function getUserId(): string {
  return PERSONAL_USER_ID;
}
