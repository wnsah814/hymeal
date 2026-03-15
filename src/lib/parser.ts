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
      const items: { category: string; desc: string }[] = [];
      $day.find(".content-item").each((_k, itemEl) => {
        const $item = $(itemEl);
        const category = $item.find(".category").text().trim();
        const desc = $item.find(".content-item-desc p").text().trim();
        if (category || desc) {
          items.push({ category, desc });
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

    shops.push({ id, code, name, date, todayMenus, weeklyMenus, info });
  });

  return shops;
}
