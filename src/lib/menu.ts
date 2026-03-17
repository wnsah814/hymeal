import { parseMenuHtml, parseDonationMenu, parseSectionPrices, enrichBreakfastDay, enrichWeeklyDay, applySectionPrices } from "./parser";
import type { MenuResponse } from "./types";

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

export async function fetchMenu(date: string): Promise<MenuResponse> {
  const dayDates = Array.from({ length: 6 }, (_, i) => addDays(date, i));
  const responses = await Promise.all(
    dayDates.map((d) =>
      fetch(`${BASE_URL}?date=${d}`, { next: { revalidate: 3600 } })
    )
  );

  for (const res of responses) {
    if (!res.ok) {
      throw new Error("Failed to fetch menu data");
    }
  }

  const htmls = await Promise.all(responses.map((r) => r.text()));

  const shops = parseMenuHtml(htmls[0]);

  for (let dayIdx = 0; dayIdx < 6; dayIdx++) {
    const dayShops = parseMenuHtml(htmls[dayIdx]);

    const donation = parseDonationMenu(htmls[dayIdx]);
    const studentShop = shops.find((s) => s.name === "학생식당");
    if (studentShop && donation) {
      enrichBreakfastDay(studentShop, dayIdx, donation);
    }

    for (const shop of shops) {
      const dayShop = dayShops.find((s) => s.id === shop.id);
      if (dayShop) {
        enrichWeeklyDay(shop, dayIdx, dayShop.todayMenus);
      }
    }
  }

  const sectionPrices = parseSectionPrices(htmls[0]);
  for (const shop of shops) {
    applySectionPrices(shop, sectionPrices);
  }

  return {
    shops,
    weekStartDate: date,
    fetchedAt: new Date().toISOString(),
  };
}
