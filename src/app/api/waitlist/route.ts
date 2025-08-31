import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const Env = z.object({
  url: z.string().url(),
  secret: z.string().min(20),
});
const Body = z.object({
  email: z.string().trim().email("Please enter a valid email"),
  topic: z.string().trim().optional().transform(v => (v && v.length ? v : null)),
});

function getAdmin() {
  const parsed = Env.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    secret: process.env.SUPABASE_SECRET_KEY,
  });
  if (!parsed.success) {
    console.error("ENV ERROR:", parsed.error.flatten());
    throw new Error("Supabase env vars missing/invalid. Check .env.local and restart dev server.");
  }
  return createClient(parsed.data.url, parsed.data.secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(req: Request) {
  try {
    const sbAdmin = getAdmin();
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });

    const parsed = Body.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map(i => i.message).join(", ");
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const { email, topic } = parsed.data;
    const { error } = await sbAdmin.from("waitlist").insert({ email, topic });
    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    console.error("API /waitlist ERROR:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Unknown error" }, { status: 500 });
  }
}
