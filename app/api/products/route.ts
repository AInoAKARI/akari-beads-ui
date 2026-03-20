import { NextResponse } from "next/server";

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

// Notion DB for beads products
const NOTION_DB_ID =
  process.env.NOTION_BEADS_DB_ID ?? "";

export async function GET() {
  try {
    if (!KEYMASTER_TOKEN) {
      return NextResponse.json(
        { error: "AKARI_KEYMASTER_TOKEN is not configured" },
        { status: 500 },
      );
    }

    if (!NOTION_DB_ID) {
      return NextResponse.json(
        { error: "NOTION_BEADS_DB_ID is not configured" },
        { status: 500 },
      );
    }

    const notionKey = await getKey("notion", "api_key");

    const res = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sorts: [{ timestamp: "created_time", direction: "descending" }],
        }),
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Notion API error: ${res.status}`, detail: text },
        { status: 502 },
      );
    }

    const data = await res.json();

    type NotionPage = {
      id: string;
      properties: Record<string, any>;
      cover?: { type: string; file?: { url: string }; external?: { url: string } } | null;
      created_time: string;
    };

    const products = (data.results as NotionPage[]).map((page) => {
      const props = page.properties;

      const title =
        props["作品名"]?.title?.[0]?.plain_text ??
        props["Name"]?.title?.[0]?.plain_text ??
        props["title"]?.title?.[0]?.plain_text ??
        "無題";

      const price =
        props["価格"]?.number ??
        props["Price"]?.number ??
        props["price"]?.number ??
        0;

      const maker =
        props["つくった人"]?.rich_text?.[0]?.plain_text ??
        props["Maker"]?.rich_text?.[0]?.plain_text ??
        "";

      const description =
        props["説明"]?.rich_text?.[0]?.plain_text ??
        props["Description"]?.rich_text?.[0]?.plain_text ??
        "";

      const paymentLink =
        props["PaymentLink"]?.url ??
        props["payment_link"]?.url ??
        props["Stripe Link"]?.url ??
        "";

      const imageUrl =
        props["画像"]?.files?.[0]?.file?.url ??
        props["画像"]?.files?.[0]?.external?.url ??
        props["Image"]?.files?.[0]?.file?.url ??
        props["Image"]?.files?.[0]?.external?.url ??
        page.cover?.file?.url ??
        page.cover?.external?.url ??
        "";

      return {
        id: page.id,
        title,
        price,
        maker,
        description,
        paymentLink,
        imageUrl,
        createdAt: page.created_time,
      };
    });

    return NextResponse.json({ products });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
