import * as cheerio from "cheerio";
import type { Shop } from "./types";

export function parseMenuHtml(html: string): Shop[] {
  const $ = cheerio.load(html);
  const shops: Shop[] = [];

  $(".menu-slide-item").each((_i, el) => {
    const $shop = $(el);
    const id = $shop.attr("id")?.replace("shop-", "") || "";
    const code = $shop.find(".round span").text().trim();
    const name = $shop.find(".location").text().trim();
    const date = $shop.find(".date").text().trim();

    // Today's menu
    const todayMenus: Shop["todayMenus"] = [];
    $shop.find("ul.menu-slide > li").each((_j, li) => {
      const $li = $(li);
      const category = $li.find(".category").text().trim();
      const title = $li.find(".title").text().trim();
      const desc = $li.find(".desc").text().trim();
      const price = $li.find(".price").text().trim();
      if (title) {
        todayMenus.push({ category, title, desc, price });
      }
    });

    // Weekly menu
    const weeklyMenus: Shop["weeklyMenus"] = [];
    const $week = $(`#shop-week-${id}`);
    $week.find(".day-container").each((_j, dayEl) => {
      const $day = $(dayEl);
      const day = $day.find(".day span").text().trim();
      const items: Shop["weeklyMenus"][number]["items"] = [];
      $day.find(".content-item").each((_k, itemEl) => {
        const $item = $(itemEl);
        const category = $item.find(".category").text().trim();
        const descs: string[] = [];
        $item.find(".content-item-desc p").each((_l, pEl) => {
          const text = $(pEl).text().trim();
          if (text) descs.push(text);
        });
        if (category || descs.length > 0) {
          items.push({ category, descs, price: "" });
        }
      });
      weeklyMenus.push({ day, items });
    });

    // Shop info
    const $info = $(`#shop-info-${id}`);
    const info = $info
      .find(".container-body")
      .text()
      .trim()
      .replace(/\s+/g, " ");

    // Structured shop info
    const location = $info.find("th:contains('위치')").next("td").text().trim();
    const $hoursTd = $info.find("th:contains('운영시간')").next("td");
    const hoursHtml = $hoursTd.html() || "";
    const hoursLines = hoursHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Extract phone number
    const phoneLine = hoursLines.find((l) => /☎/.test(l));
    const phone = phoneLine?.replace(/☎\s*/, "").trim() || "";

    // Filter out noise lines (원산지, 문의, phone) to keep only hours
    const hours = hoursLines
      .filter(
        (l) =>
          !l.includes("원산지") &&
          !l.includes("문의") &&
          !l.includes("☎") &&
          !l.includes("RE-OPEN") &&
          !l.includes("감사드립니다") &&
          !l.includes("재오픈") &&
          !l.includes("헤이영") &&
          !l.includes("식권은") &&
          !l.includes("식권신청") &&
          !l.includes("고객 여러분") &&
          !l.includes("구입 가능")
      )
      .join("\n");

    const shopInfo = { location, hours, phone };

    shops.push({ id, code, name, date, todayMenus, weeklyMenus, info, shopInfo });
  });

  return shops;
}

/**
 * Parse section-level prices (천원의 아침밥, 오늘의 라면, 오늘의 컵밥 등)
 * from the standalone .section-menu blocks.
 */
export function parseSectionPrices(html: string): Record<string, string> {
  const $ = cheerio.load(html);
  const prices: Record<string, string> = {};
  $(".section-menu").each((_i, el) => {
    const title = $(el).find(".section-title b").text().trim();
    const price = $(el).find(".price").first().text().trim();
    if (title && price) {
      prices[title] = price;
    }
  });
  return prices;
}

/**
 * Parse the #donation section which contains 천원의 아침밥 data
 * with both 백반식 (title) and 간편식 (desc).
 */
export function parseDonationMenu(html: string): { title: string; desc: string } | null {
  const $ = cheerio.load(html);
  const $donation = $("#donation .menu-donation");
  if ($donation.length === 0) return null;

  const title = $donation.find(".content-body .title-wrap .title").text().trim();
  const desc = $donation.find(".content-body .desc").text().trim();
  if (!title) return null;

  return { title, desc };
}

/**
 * Enrich a shop's weeklyMenus for a specific day index
 * with 천원의 아침밥 donation data (백반식 + 간편식).
 */
export function enrichBreakfastDay(
  shop: Shop,
  dayIndex: number,
  donation: { title: string; desc: string }
) {
  const dayMenu = shop.weeklyMenus[dayIndex];
  if (!dayMenu) return;

  const breakfastItem = dayMenu.items.find(
    (item) => item.category === "천원의 아침밥"
  );

  if (breakfastItem) {
    const descs: string[] = [];
    if (donation.title && donation.title !== "-") descs.push(donation.title);
    if (donation.desc && donation.desc !== "-" && donation.desc !== ".") descs.push(donation.desc);
    if (descs.length > 0) {
      breakfastItem.descs = descs;
    }
    if (!breakfastItem.price) {
      breakfastItem.price = "1,000원";
    }
  }
}

function isEmptyDesc(desc: string): boolean {
  return !desc || desc === "-" || desc === ".";
}

/**
 * Enrich a shop's weeklyMenus for a specific day index
 * using todayMenus (which has title + desc per category).
 * The weekly HTML only has one line per category, but todayMenus
 * has additional sub-menus in the desc field.
 */
export function enrichWeeklyDay(
  shop: Shop,
  dayIndex: number,
  todayMenus: Shop["todayMenus"]
) {
  const dayMenu = shop.weeklyMenus[dayIndex];
  if (!dayMenu) return;

  for (const todayItem of todayMenus) {
    // Match by category name
    const weeklyItem = dayMenu.items.find(
      (item) => item.category === todayItem.category
    );
    if (!weeklyItem) continue;

    if (!isEmptyDesc(todayItem.desc) && weeklyItem.descs.length === 1) {
      weeklyItem.descs.push(todayItem.desc);
    }
    if (todayItem.price && !weeklyItem.price) {
      weeklyItem.price = todayItem.price;
    }
  }
}

/**
 * Apply section-level prices to weekly menu items that don't have a price yet.
 * Matches by category name (e.g. "오늘의 라면" → "오늘의 라면").
 */
export function applySectionPrices(
  shop: Shop,
  sectionPrices: Record<string, string>
) {
  for (const dayMenu of shop.weeklyMenus) {
    for (const item of dayMenu.items) {
      if (!item.price && sectionPrices[item.category]) {
        item.price = sectionPrices[item.category];
      }
    }
  }
}
