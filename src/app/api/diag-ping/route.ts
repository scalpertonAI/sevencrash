import { NextResponse } from "next/server";
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return NextResponse.json({ ok:false, error:"URL missing" }, { status: 500 });
  try {
    const res = await fetch(url, { method: "HEAD" });
    return NextResponse.json({ ok:true, status: res.status });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || "fetch failed" }, { status: 500 });
  }
}
