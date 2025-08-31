import { NextResponse } from "next/server";
function mask(v?: string) { if (!v) return null; return v.slice(0,6) + "...(" + v.length + " chars)"; }
export async function GET() {
  return NextResponse.json({
    url_present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishable_present: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    secret_present: !!process.env.SUPABASE_SECRET_KEY,
    url_preview: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    publishable_preview: mask(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    secret_preview: mask(process.env.SUPABASE_SECRET_KEY),
  });
}
