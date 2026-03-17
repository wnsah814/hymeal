import { NextRequest, NextResponse } from "next/server";
import { parseMenuHtml, parseDonationMenu, parseSectionPrices, enrichBreakfastDay, enrichWeeklyDay, applySectionPrices } from "@/lib/parser";
import type { MenuResponse } from "@/lib/types";

const BASE_URL = "https://fnb.hanyang.ac.kr/front/fnbmMdMenu";

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const ry = date.getFullYear();
  const rm = String(date.getMonth() + 1).padStart(2, "0");
  const rd = String(date.getDate()).padStart(2, "0");
  return `${ry}-${rm}-${rd}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const date = searchParams.get("date") || fallback;

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

    // Apply section-level prices (오늘의 라면, 오늘의 컵밥 등)
    const sectionPrices = parseSectionPrices(htmls[0]);
    for (const shop of shops) {
      applySectionPrices(shop, sectionPrices);
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
