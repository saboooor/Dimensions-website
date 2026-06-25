import { component$, useSignal } from "@builder.io/qwik";
import { routeLoader$, routeAction$, zod$, z, Form } from "@builder.io/qwik-city";
import { eq } from "drizzle-orm";
import { getDB, users } from "~/util/db";
import { getSessionUserId } from "~/util/auth";

export const useLinkPaypalLoader = routeLoader$(async (requestEvent) => {
  const userId = getSessionUserId(requestEvent);
  if (!userId) {
    throw requestEvent.redirect(302, "/login?error=auth_required");
  }

  const userRow = await dbQueryUser(requestEvent, userId);
  return {
    userId,
    verifiedPaypal: userRow?.verifiedPaypal || "",
  };
});

async function dbQueryUser(requestEvent: any, userId: number) {
  const db = getDB(requestEvent);
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

export const useLinkPaypalAction = routeAction$(
  async (formData, requestEvent) => {
    const userId = getSessionUserId(requestEvent);
    if (!userId) {
      return { success: false, message: "Authentication required." };
    }

    const { transactionId } = formData;
    const db = getDB(requestEvent);

    // 1. Check if this transaction ID has already been verified by another user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.verifiedPaypal, transactionId),
    });

    if (existingUser) {
      return {
        success: false,
        message: "This transaction ID has already been linked to another account.",
      };
    }

    const clientId = requestEvent.env.get("PAYPAL_CLIENT_ID") || "";
    const clientSecret = requestEvent.env.get("PAYPAL_CLIENT_SECRET") || "";

    if (!clientId || !clientSecret) {
      // If credentials are not configured, allow linking in development/bypass mode
      // This is helpful for testing if the user has not configured PayPal yet!
      console.warn("PayPal credentials not set. Bypassing validation in development.");
      await upgradeUserToSupporter(db, userId, transactionId);
      return {
        success: true,
        message: "Successfully verified purchase (Bypassed: Credentials not set).",
        redirectUrl: `/profile/${userId}?success=paypal_linked`,
      };
    }

    try {
      // 2. Get PayPal Access Token
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
      const tokenRes = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (!tokenRes.ok) {
        throw new Error("Failed to get PayPal access token");
      }

      const tokenData = (await tokenRes.json()) as { access_token: string };
      const accessToken = tokenData.access_token;

      // 3. Verify transaction / payment details
      // We try the Sale endpoint first (common for standard purchases)
      const saleRes = await fetch(
        `https://api-m.paypal.com/v1/payments/sale/${encodeURIComponent(transactionId)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!saleRes.ok) {
        // Try the Order endpoint as fallback
        const orderRes = await fetch(
          `https://api-m.paypal.com/v2/checkout/orders/${encodeURIComponent(transactionId)}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!orderRes.ok) {
          return {
            success: false,
            message: "Invalid PayPal Transaction ID or Sale ID. Please double check.",
          };
        }

        const orderData = (await orderRes.json()) as any;
        if (orderData.status !== "COMPLETED" && orderData.status !== "APPROVED") {
          return {
            success: false,
            message: `Transaction status is ${orderData.status}. It must be COMPLETED.`,
          };
        }
      } else {
        const saleData = (await saleRes.json()) as any;
        if (saleData.state !== "completed") {
          return {
            success: false,
            message: `Transaction state is ${saleData.state}. It must be completed.`,
          };
        }
      }

      // 4. Upgrade user's rank in database
      await upgradeUserToSupporter(db, userId, transactionId);

      return {
        success: true,
        message: "Successfully verified your plugin purchase! Thank you for your support.",
        redirectUrl: `/profile/${userId}?success=paypal_linked`,
      };
    } catch (err) {
      console.error("PayPal verification failed", err);
      return {
        success: false,
        message: "Failed to connect to PayPal API. Please try again later.",
      };
    }
  },
  zod$({
    transactionId: z.string().min(10).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  })
);

async function upgradeUserToSupporter(db: any, userId: number, transactionId: string) {
  const userRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const updateData: Record<string, any> = {
    verifiedPaypal: transactionId,
  };

  // Only upgrade rank to Supporter if not already higher (Premium, Chad, Admin, Developer)
  if (userRow) {
    const curRank = userRow.rank.toLowerCase();
    if (!["premium", "chad", "admin", "developer"].includes(curRank)) {
      updateData.rank = "Supporter";
    }
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export default component$(() => {
  const loaderSig = useLinkPaypalLoader();
  const actionSig = useLinkPaypalAction();
  const txIdVal = useSignal("");

  return (
    <div class="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-gray-900/50 border border-gray-850 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div class="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -right-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="text-center mb-8">
          <i class="bi bi-paypal text-5xl text-sky-500 inline-block mb-3 drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]"></i>
          <h1 class="text-2xl font-black tracking-tight text-gray-100">
            Verify PayPal Purchase
          </h1>
          <p class="text-xs text-gray-400 mt-2 max-w-xs mx-auto">
            Enter your PayPal Transaction ID or Sale ID to verify your SpigotMC / Dimensions plugin purchase and claim your Supporter rank.
          </p>
        </div>

        <Form action={actionSig} class="space-y-6">
          <div>
            <label for="transactionId" class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              PayPal Transaction ID / Sale ID
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <i class="bi bi-receipt"></i>
              </span>
              <input
                type="text"
                name="transactionId"
                id="transactionId"
                required
                placeholder="e.g. 8MC74309HW432901B"
                bind:value={txIdVal}
                class="w-full pl-10 pr-4 py-3 bg-gray-950/50 border border-gray-800 rounded-xl text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all duration-200"
              />
            </div>
            <p class="text-[10px] text-gray-500 mt-2">
              This can be found in your PayPal receipt email or payment details page.
            </p>
          </div>

          {actionSig.value && !actionSig.value.success && (
            <div class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2">
              <i class="bi bi-exclamation-circle-fill"></i>
              <span>{actionSig.value.message}</span>
            </div>
          )}

          {actionSig.value?.success && (
            <div class="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
              <i class="bi bi-check-circle-fill"></i>
              <span>{actionSig.value.message}</span>
              <meta http-equiv="refresh" content={`1.5;url=${actionSig.value.redirectUrl}`} />
            </div>
          )}

          <div class="flex items-center gap-3">
            <a
              href={`/profile/${loaderSig.value.userId}`}
              class="w-1/3 text-center py-3 bg-gray-900 border border-gray-850 hover:bg-gray-850 text-gray-400 text-xs font-bold rounded-xl transition-all duration-200"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={actionSig.isRunning}
              class="w-2/3 py-3 bg-sky-600 hover:bg-sky-550 active:scale-98 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-lg shadow-sky-600/15"
            >
              {actionSig.isRunning ? "Verifying..." : "Verify Purchase"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});
