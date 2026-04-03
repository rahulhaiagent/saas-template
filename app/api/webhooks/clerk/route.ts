import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SIGNING_SECRET", { status: 500 });
  }

  // Verify the webhook signature
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(SIGNING_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const supabase = createAdminClient();

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses.find(
        (e) => e.id === evt.data.primary_email_address_id
      );

      await supabase.from("profiles").upsert(
        {
          clerk_id: id,
          email: primaryEmail?.email_address ?? "",
          first_name: first_name ?? null,
          last_name: last_name ?? null,
          avatar_url: image_url ?? null,
        },
        { onConflict: "clerk_id" }
      );
      break;
    }

    case "user.deleted": {
      const { id } = evt.data;
      if (id) {
        // Soft delete — set deleted_at timestamp
        await supabase
          .from("profiles")
          .update({ deleted_at: new Date().toISOString() })
          .eq("clerk_id", id);
      }
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
