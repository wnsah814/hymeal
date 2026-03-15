import { NextRequest, NextResponse } from "next/server";
import { parseMenuHtml } from "@/lib/parser";
import type { MenuResponse } from "@/lib/types";

const BASE_URL = "https://fnb.hanyang.ac.kr/front/fnbmMdMenu";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  try {
    const res = await fetch(`${BASE_URL}?date=${date}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch menu data" },
        { status: 502 }
      );
    }

    const html = await res.text();
    const shops = parseMenuHtml(html);

    const data: MenuResponse = {
      shops,
      weekStartDate: date,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
