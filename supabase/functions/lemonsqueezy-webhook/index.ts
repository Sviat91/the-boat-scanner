import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const secret = Deno.env.get("LS_WEBHOOK_SECRET"); // 👈 webhook secret for HMAC verification

/* HMAC helpers for signature verification */
function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(key, data) {
  const keyBuf = new TextEncoder().encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return bytesToHex(new Uint8Array(sig));
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

// Credits to award for each variant_id
const CREDITS = {
  882183: 5,
  882203: 20
};

// variant_id of the monthly subscription
const SUBSCRIPTION_IDS = [882216];

serve(async (req) => {
  // Get RAW body (needed for signature verification)
  const raw = new Uint8Array(await req.arrayBuffer());
  
  // Get signature from Lemon Squeezy header
  const headerSig = req.headers.get("X-Signature") ?? "";
  
  // Calculate our own signature and compare
  const calcSig = await hmacSha256Hex(secret, raw);
  if (calcSig !== headerSig) {
    console.error("❌ Invalid webhook signature detected:", { headerSig, calcSig });
    return new Response("invalid signature", { status: 401 });
  }

  // ✅ Signature is valid — parse JSON
  const body = JSON.parse(new TextDecoder().decode(raw));
  const uid = body.meta?.custom_data?.uid;
  const variantId = body.data?.attributes?.first_order_item?.variant_id;

  // --- Subscription handling -------------------------------------
  let expires = null;
  if (SUBSCRIPTION_IDS.includes(variantId)) {
    const renewsAt = body.data?.attributes?.renews_at;
    expires = renewsAt
      ? new Date(new Date(renewsAt).getTime() + 24 * 60 * 60 * 1000) // +1 day grace
      : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000); // fallback 31 days

    await supabase
      .from("user_credits")
      .update({ subscribed_until: expires.toISOString() })
      .eq("uid", uid)
      .throwOnError();
  }
  // ----------------------------------------------------------------

  console.log("✅ Valid webhook processed:", { uid, variantId });

  // Award credits based on variant_id
  if (uid && variantId && CREDITS[variantId]) {
    await supabase
      .rpc("add_paid_credits", { p_uid: uid, p_amount: CREDITS[variantId] })
      .throwOnError();
  }

  return new Response("ok", { status: 200 });
});

