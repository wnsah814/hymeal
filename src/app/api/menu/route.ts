import { NextRequest, NextResponse } from "next/server";
import { parseMenuHtml, parseDonationMenu, enrichBreakfastDay, enrichWeeklyDay } from "@/lib/parser";
import type { MenuResponse } from "@/lib/types";

const BASE_URL = "https://fnb.hanyang.ac.kr/front/fnbmMdMenu";

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date =
    searchParams.get("date") || new Date().toISOString().slice(0, 10);

  try {
    // Fetch all 6 days (Mon-Sat) in parallel to get donation (천원의 아침밥) data for each day
    const dayDates = Array.from({ length: 6 }, (_, i) => addDays(date, i));
    const responses = await Promise.all(
      dayDates.map((d) =>
        fetch(`${BASE_URL}?date=${d}`, { next: { revalidate: 3600 } })
      )
    );

    for (const res of responses) {
      if (!res.ok) {
        return NextResponse.json(
          { error: "Failed to fetch menu data" },
          { status: 502 }
        );
      }
    }

    const htmls = await Promise.all(responses.map((r) => r.text()));

    // Parse the first day to get the base shop data (includes weeklyMenus for the whole week)
    const shops = parseMenuHtml(htmls[0]);

    // Enrich weeklyMenus with per-day todayMenus data
    for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
      const dayShops = parseMenuHtml(htmls[dayIdx]);

      // Enrich 천원의 아침밥 with donation data (백반식 + 간편식)
      const donation = parseDonationMenu(htmls[dayIdx]);
      const studentShop = shops.find((s) => s.name === "학생식당");
      if (studentShop && donation) {
        enrichBreakfastDay(studentShop, dayIdx, donation);
      }

      // Enrich all shops with todayMenus sub-menus (desc)
      for (const shop of shops) {
        const dayShop = dayShops.find((s) => s.id === shop.id);
        if (dayShop) {
          enrichWeeklyDay(shop, dayIdx, dayShop.todayMenus);
        }
      }
    }

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
