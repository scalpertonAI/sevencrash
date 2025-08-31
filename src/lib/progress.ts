"use client";
import { sb } from "@/lib/supabase-browser";

export async function toggleItemDone(itemId: string, done: boolean) {
  const supabase = sb;
  const { error } = await supabase.rpc("toggle_item_done", {
    p_item_id: itemId,
    p_done: done,
  });
  if (error) throw error;
}
