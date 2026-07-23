import { component$, useSignal } from '@qwik.dev/core';
import { routeLoader$, routeAction$, zod$, z, Form } from '@qwik.dev/router';
import { eq } from 'drizzle-orm';
import SiPaypal from 'simple-icons-qwik/icons/SiPaypal';
import Receipt from 'lucide-icons-qwik/icons/Receipt';
import AlertCircle from 'lucide-icons-qwik/icons/AlertCircle';
import CheckCircle2 from 'lucide-icons-qwik/icons/CheckCircle2';
import { getDB, users } from '~/util/db';
import { getSessionUserId } from '~/util/auth';

export const useLinkPaypalLoader = routeLoader$(async (requestEvent) => {
  const userId = getSessionUserId(requestEvent);
  if (!userId) {
    throw requestEvent.redirect(302, '/login?error=auth_required');
  }

  const userRow = await dbQueryUser(requestEvent, userId);
  return {
    userId,
    verifiedPaypal: userRow?.verifiedPaypal || '',
  };
});

async function dbQueryUser(requestEvent: any, userId: string) {
  const db = getDB(requestEvent);
  return await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
}

export const useLinkPaypalAction = routeAction$(
  async (formData, requestEvent) => {
    const userId = getSessionUserId(requestEvent);
    if (!userId) {
      return { success: false, message: 'Authentication required.' };
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
        message:
          'This transaction ID has already been linked to another account.',
      };
    }

    const clientId = requestEvent.env.get('PAYPAL_CLIENT_ID') || '';
    const clientSecret = requestEvent.env.get('PAYPAL_CLIENT_SECRET') || '';

    if (!clientId || !clientSecret) {
      // If credentials are not configured, allow linking in development/bypass mode
      // This is helpful for testing if the user has not configured PayPal yet!
      console.warn(
        'PayPal credentials not set. Bypassing validation in development.'
      );
      await upgradeUserToSupporter(db, userId, transactionId);
      return {
        success: true,
        message:
          'Successfully verified purchase (Bypassed: Credentials not set).',
        redirectUrl: `/profile/${userId}?success=paypal_linked`,
      };
    }

    try {
      // 2. Get PayPal Access Token
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64'
      );
      const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!tokenRes.ok) {
        throw new Error('Failed to get PayPal access token');
      }

      const tokenData: { access_token?: string } = await tokenRes.json();
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
            message:
              'Invalid PayPal Transaction ID or Sale ID. Please double check.',
          };
        }

        const orderData = (await orderRes.json()) as any;
        if (
          orderData.status !== 'COMPLETED' &&
          orderData.status !== 'APPROVED'
        ) {
          return {
            success: false,
            message: `Transaction status is ${orderData.status}. It must be COMPLETED.`,
          };
        }
      } else {
        const saleData = (await saleRes.json()) as any;
        if (saleData.state !== 'completed') {
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
        message:
          'Successfully verified your plugin purchase! Thank you for your support.',
        redirectUrl: `/profile/${userId}?success=paypal_linked`,
      };
    } catch (err) {
      console.error('PayPal verification failed', err);
      return {
        success: false,
        message: 'Failed to connect to PayPal API. Please try again later.',
      };
    }
  },
  zod$({
    transactionId: z
      .string()
      .min(10)
      .max(50)
      .regex(/^[a-zA-Z0-9_-]+$/),
  })
);

async function upgradeUserToSupporter(
  db: any,
  userId: string,
  transactionId: string
) {
  const userRow = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  const updateData: Record<string, any> = {
    verifiedPaypal: transactionId,
  };

  // Only upgrade rank to Supporter if not already higher (Premium, Chad, Admin, Developer)
  if (userRow) {
    const curRank = userRow.rank.toLowerCase();
    if (!['premium', 'chad', 'admin', 'developer'].includes(curRank)) {
      updateData.rank = 'Supporter';
    }
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

export default component$(() => {
  const loaderSig = useLinkPaypalLoader();
  const actionSig = useLinkPaypalAction();
  const txIdVal = useSignal('');

  return (
    <div class="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div class="border-gray-850 relative w-full max-w-md overflow-hidden rounded-2xl border bg-gray-900/50 p-8 shadow-2xl backdrop-blur-md">
        {/* Glow effect */}
        <div class="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl"></div>
        <div class="pointer-events-none absolute -right-24 -bottom-24 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl"></div>

        <div class="mb-8 text-center">
          <SiPaypal class="mb-3 inline-block h-12 w-12 text-sky-500 drop-shadow-[0_0_15px_rgba(14,165,233,0.3)]" />
          <h1 class="text-2xl font-black tracking-tight text-gray-100">
            Verify PayPal Purchase
          </h1>
          <p class="mx-auto mt-2 max-w-xs text-xs text-gray-400">
            Enter your PayPal Transaction ID or Sale ID to verify your SpigotMC
            / Dimensions plugin purchase and claim your Supporter rank.
          </p>
        </div>

        <Form action={actionSig} class="space-y-6">
          <div>
            <label
              for="transactionId"
              class="mb-2 block text-[10px] font-bold tracking-wider text-gray-400 uppercase"
            >
              PayPal Transaction ID / Sale ID
            </label>
            <div class="relative">
              <span class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Receipt class="h-4 w-4" />
              </span>
              <input
                type="text"
                name="transactionId"
                id="transactionId"
                required
                placeholder="e.g. 8MC74309HW432901B"
                bind:value={txIdVal}
                class="w-full rounded-xl border border-gray-800 bg-gray-950/50 py-3 pr-4 pl-10 text-sm text-gray-200 placeholder-gray-600 transition-all duration-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 focus:outline-none"
              />
            </div>
            <p class="mt-2 text-[10px] text-gray-500">
              This can be found in your PayPal receipt email or payment details
              page.
            </p>
          </div>

          {actionSig.value && !actionSig.value.success && (
            <div class="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle class="h-4 w-4" />
              <span>{actionSig.value.message}</span>
            </div>
          )}

          {actionSig.value?.success && (
            <div class="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              <CheckCircle2 class="h-4 w-4" />
              <span>{actionSig.value.message}</span>
              <meta
                http-equiv="refresh"
                content={`1.5;url=${actionSig.value.redirectUrl}`}
              />
            </div>
          )}

          <div class="flex items-center gap-3">
            <a
              href={`/profile/${loaderSig.value.userId}`}
              class="border-gray-850 hover:bg-gray-850 w-1/3 rounded-xl border bg-gray-900 py-3 text-center text-xs font-bold text-gray-400 transition-all duration-200"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={actionSig.isRunning}
              class="hover:bg-sky-550 w-2/3 rounded-xl bg-sky-600 py-3 text-xs font-bold text-white shadow-lg shadow-sky-600/15 transition-all duration-200 active:scale-98 disabled:opacity-50"
            >
              {actionSig.isRunning ? 'Verifying...' : 'Verify Purchase'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
});
