"use client";

import { useEffect, useState, useCallback } from "react";
import type { MenuResponse, Shop } from "@/lib/types";

const DAYS = ["월", "화", "수", "목", "금", "토"] as const;
const TICKET_URL = "https://fnb.hanyang.ac.kr/front/fnbgMdStmtApply";
// 체육부실 식당 ID
const CHEYUK_SHOP_ID = "ykXDLy--QLyRQBF0owQPhg";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getTodayDayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? -1 : day - 1;
}

export default function Home() {
  const [data, setData] = useState<MenuResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(
    Math.max(0, Math.min(getTodayDayIndex(), 5))
  );
  const [view, setView] = useState<"today" | "week">("today");

  const monday = getMonday(addDays(new Date(), weekOffset * 7));
  const mondayStr = formatDate(monday);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menu?date=${mondayStr}`);
      const json: MenuResponse = await res.json();
      setData(json);
      if (!selectedShop && json.shops.length > 0) {
        setSelectedShop(json.shops[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch menu:", err);
    } finally {
      setLoading(false);
    }
  }, [mondayStr]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const currentShop = data?.shops.find((s) => s.id === selectedShop);

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">HYMeal</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          한양대학교 식당 메뉴
        </p>
      </header>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((p) => p - 1)}
          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
        >
          &larr; 이전주
        </button>
        <span className="text-sm font-medium">
          {mondayStr} ~ {formatDate(addDays(monday, 5))}
        </span>
        <button
          onClick={() => setWeekOffset((p) => p + 1)}
          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
        >
          다음주 &rarr;
        </button>
      </div>

      {weekOffset !== 0 && (
        <div className="flex justify-center mb-4">
          <button
            onClick={() => {
              setWeekOffset(0);
              setSelectedDay(Math.max(0, Math.min(getTodayDayIndex(), 5)));
            }}
            className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            오늘로 돌아가기
          </button>
        </div>
      )}

      {/* Shop tabs */}
      {data && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
          {data.shops.map((shop) => (
            <button
              key={shop.id}
              onClick={() => setSelectedShop(shop.id)}
              className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedShop === shop.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {shop.name}
            </button>
          ))}
        </div>
      )}

      {/* View toggle + Ticket button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setView("today")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === "today"
                ? "bg-white dark:bg-slate-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            일간
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === "week"
                ? "bg-white dark:bg-slate-600 shadow-sm"
                : "text-slate-500"
            }`}
          >
            주간
          </button>
        </div>

        {selectedShop === CHEYUK_SHOP_ID && (
          <a
            href={TICKET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
          >
            식권 구매 &rarr;
          </a>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && currentShop && (
        <>
          {view === "today" ? (
            <TodayView
              shop={currentShop}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              weekOffset={weekOffset}
            />
          ) : (
            <WeekView
              shop={currentShop}
              selectedDay={selectedDay}
              setSelectedDay={setSelectedDay}
              weekOffset={weekOffset}
            />
          )}
        </>
      )}

      {!loading && data?.shops.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          메뉴 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}

function TodayView({
  shop,
  selectedDay,
  setSelectedDay,
  weekOffset,
}: {
  shop: Shop;
  selectedDay: number;
  setSelectedDay: (d: number) => void;
  weekOffset: number;
}) {
  const todayIdx = getTodayDayIndex();
  const dayMenu = shop.weeklyMenus[selectedDay];

  return (
    <div>
      <DayTabs
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        todayIdx={weekOffset === 0 ? todayIdx : -1}
      />
      {dayMenu && dayMenu.items.length > 0 ? (
        <div className="space-y-3 mt-4">
          {dayMenu.items.map((item, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium mb-2">
                {item.category}
              </span>
              <p className="text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 text-sm">
          해당 요일에는 운영하지 않습니다.
        </div>
      )}
    </div>
  );
}

function WeekView({
  shop,
  selectedDay,
  setSelectedDay,
  weekOffset,
}: {
  shop: Shop;
  selectedDay: number;
  setSelectedDay: (d: number) => void;
  weekOffset: number;
}) {
  const todayIdx = getTodayDayIndex();

  const allCategories = Array.from(
    new Set(
      shop.weeklyMenus.flatMap((d) => d.items.map((item) => item.category))
    )
  );

  return (
    <div>
      <DayTabs
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        todayIdx={weekOffset === 0 ? todayIdx : -1}
      />

      {/* Desktop: full week table */}
      <div className="hidden md:block mt-4 overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b border-slate-200 dark:border-slate-700 text-slate-500 w-24">
                구분
              </th>
              {DAYS.map((day, i) => (
                <th
                  key={day}
                  className={`text-left p-2 border-b border-slate-200 dark:border-slate-700 ${
                    weekOffset === 0 && i === todayIdx
                      ? "text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-500"
                  }`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allCategories.map((cat) => (
              <tr key={cat}>
                <td className="p-2 border-b border-slate-100 dark:border-slate-700/50 font-medium text-xs text-blue-700 dark:text-blue-300 align-top whitespace-nowrap">
                  {cat}
                </td>
                {DAYS.map((day, i) => {
                  const dayMenu = shop.weeklyMenus[i];
                  const item = dayMenu?.items.find(
                    (it) => it.category === cat
                  );
                  return (
                    <td
                      key={day}
                      className={`p-2 border-b border-slate-100 dark:border-slate-700/50 text-xs align-top leading-relaxed ${
                        weekOffset === 0 && i === todayIdx
                          ? "bg-blue-50/50 dark:bg-blue-900/10"
                          : ""
                      }`}
                    >
                      {item?.desc || "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: selected day detail */}
      <div className="md:hidden mt-4">
        {shop.weeklyMenus[selectedDay]?.items.length > 0 ? (
          <div className="space-y-3">
            {shop.weeklyMenus[selectedDay].items.map((item, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
              >
                <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium mb-2">
                  {item.category}
                </span>
                <p className="text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-sm">
            해당 요일에는 운영하지 않습니다.
          </div>
        )}
      </div>
    </div>
  );
}

function DayTabs({
  selectedDay,
  setSelectedDay,
  todayIdx,
}: {
  selectedDay: number;
  setSelectedDay: (d: number) => void;
  todayIdx: number;
}) {
  return (
    <div className="flex gap-1">
      {DAYS.map((day, i) => (
        <button
          key={day}
          onClick={() => setSelectedDay(i)}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors relative ${
            selectedDay === i
              ? "bg-blue-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          {day}
          {i === todayIdx && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
