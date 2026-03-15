import * as cheerio from "cheerio";
import fs from "fs";

const html = fs.readFileSync("scripts/raw.html", "utf8");
const $ = cheerio.load(html);

function parseShops() {
  const shops = [];

  $(".menu-slide-item").each((i, el) => {
    const $shop = $(el);
    const id = $shop.attr("id")?.replace("shop-", "") || "";
    const code = $shop.find(".round span").text().trim();
    const name = $shop.find(".location").text().trim();
    const date = $shop.find(".date").text().trim();

    // Parse today's menu
    const todayMenus = [];
    $shop.find("ul.menu-slide > li").each((j, li) => {
      const $li = $(li);
      const category = $li.find(".category").text().trim();
      const title = $li.find(".title").text().trim();
      const desc = $li.find(".desc").text().trim();
      const price = $li.find(".price").text().trim();
      if (title) {
        todayMenus.push({ category, title, desc, price });
      }
    });

    // Parse weekly menu from shop-week container
    const weeklyMenus = [];
    const $week = $(`#shop-week-${id}`);
    $week.find(".day-container").each((j, dayEl) => {
      const $day = $(dayEl);
      const day = $day.find(".day span").text().trim();
      const items = [];
      $day.find(".content-item").each((k, itemEl) => {
        const $item = $(itemEl);
        const category = $item.find(".category").text().trim();
        const desc = $item.find(".content-item-desc p").text().trim();
        if (category || desc) {
          items.push({ category, desc });
        }
      });
      weeklyMenus.push({ day, items });
    });

    // Parse shop info
    const $info = $(`#shop-info-${id}`);
    const infoHtml = $info.find(".container-body").text().trim();

    shops.push({
      id,
      code,
      name,
      date,
      todayMenus,
      weeklyMenus,
      info: infoHtml.replace(/\s+/g, " ").substring(0, 300),
    });
  });

  return shops;
}

const result = parseShops();
console.log(JSON.stringify(result, null, 2));
