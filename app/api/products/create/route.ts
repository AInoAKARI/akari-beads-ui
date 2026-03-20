import { NextRequest, NextResponse } from "next/server";

const KEYMASTER_URL =
  process.env.AKARI_KEYMASTER_URL?.replace(/\/$/, "") ??
  "https://akari-vault-keymaster.onrender.com";

const KEYMASTER_TOKEN = process.env.AKARI_KEYMASTER_TOKEN ?? "";

async function getKey(apiName: string, keyName: string): Promise<string> {
  const res = await fetch(
    `${KEYMASTER_URL}/vault/api-key?api_name=${apiName}&key_name=${keyName}`,
    {
      headers: { Authorization: `Bearer ${KEYMASTER_TOKEN}` },
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`Keymaster error for ${apiName}/${keyName}: ${res.status}`);
  }
  const json = await res.json();
  return json[keyName] ?? json.value ?? "";
}

export async function POST(request: NextRequest) {
  try {
    if (!KEYMASTER_TOKEN) {
      return NextResponse.json(
        { error: "AKARI_KEYMASTER_TOKEN is not configured" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const title = formData.get("title")?.toString().trim() ?? "";
    const price = formData.get("price")?.toString() ?? "500";
    const maker = formData.get("maker")?.toString().trim() ?? "";
    const description = formData.get("description")?.toString().trim() ?? "";

    if (!title) {
      return NextResponse.json(
        { error: "作品名は必須です" },
        { status: 400 },
      );
    }

    // Get Stripe secret key from Keymaster
    const stripeKey = await getKey("stripe", "secret_key");

    // Determine unit amount (JPY is zero-decimal currency)
    const isTipJar = price === "投げ銭";
    const unitAmount = isTipJar ? undefined : parseInt(price, 10);

    // Build product name
    const productName = maker
      ? `${title} (by ${maker})`
      : title;

    // Create a Stripe Product
    const productRes = await fetch("https://api.stripe.com/v1/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        name: productName,
        ...(description ? { description } : {}),
      }),
    });

    if (!productRes.ok) {
      const errText = await productRes.text();
      return NextResponse.json(
        { error: "Stripe Product作成に失敗しました", detail: errText },
        { status: 502 },
      );
    }

    const product = await productRes.json();

    // Create a Stripe Price
    const priceParams: Record<string, string> = {
      product: product.id,
      currency: "jpy",
    };

    if (isTipJar) {
      // Customer-chosen amount for 投げ銭
      priceParams["custom_unit_amount[enabled]"] = "true";
      priceParams["custom_unit_amount[minimum]"] = "100";
      priceParams["custom_unit_amount[preset]"] = "500";
    } else {
      priceParams["unit_amount"] = String(unitAmount);
    }

    const priceRes = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(priceParams),
    });

    if (!priceRes.ok) {
      const errText = await priceRes.text();
      return NextResponse.json(
        { error: "Stripe Price作成に失敗しました", detail: errText },
        { status: 502 },
      );
    }

    const stripePrice = await priceRes.json();

    // Create a Stripe Payment Link
    const linkRes = await fetch("https://api.stripe.com/v1/payment_links", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "line_items[0][price]": stripePrice.id,
        "line_items[0][quantity]": "1",
        ...(isTipJar
          ? { "line_items[0][adjustable_quantity][enabled]": "false" }
          : {}),
      }),
    });

    if (!linkRes.ok) {
      const errText = await linkRes.text();
      return NextResponse.json(
        { error: "Stripe Payment Link作成に失敗しました", detail: errText },
        { status: 502 },
      );
    }

    const paymentLink = await linkRes.json();

    // Optionally save to Notion DB if configured
    const notionDbId = process.env.NOTION_BEADS_DB_ID;
    if (notionDbId) {
      try {
        const notionKey = await getKey("notion", "api_key");
        await fetch("https://api.notion.com/v1/pages", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${notionKey}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parent: { database_id: notionDbId },
            properties: {
              "作品名": { title: [{ text: { content: title } }] },
              "価格": { number: unitAmount ?? 0 },
              "つくった人": { rich_text: [{ text: { content: maker } }] },
              "説明": { rich_text: [{ text: { content: description } }] },
              "PaymentLink": { url: paymentLink.url },
            },
          }),
        });
      } catch {
        // Notion save is best-effort; payment link was already created
      }
    }

    return NextResponse.json({
      productUrl: paymentLink.url,
      stripeProductId: product.id,
      stripePriceId: stripePrice.id,
      paymentLinkId: paymentLink.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
