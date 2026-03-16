"use client";

import { useEffect, useState, useCallback } from "react";
import type { MenuResponse, Shop } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  RotateCcw,
  Ticket,
  UtensilsCrossed,
} from "lucide-react";

const DAYS = ["월", "화", "수", "목", "금", "토"] as const;
const TICKET_URL = "https://fnb.hanyang.ac.kr/front/fnbgMdStmtApply";
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

function formatDateShort(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
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
  const [viewTab, setViewTab] = useState<string>("daily");

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
  const isCheyuk = selectedShop === CHEYUK_SHOP_ID;

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-6 pb-20">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">
              HYMeal
            </h1>
            <p className="text-xs text-muted-foreground">한양대 식단</p>
          </div>
        </div>
        {isCheyuk && (
          <a href={TICKET_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <Ticket className="w-3.5 h-3.5" />
              식권 구매
            </Button>
          </a>
        )}
      </header>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-5">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setWeekOffset((p) => p - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {weekOffset === 0 ? (
          <span className="text-sm font-medium">
            {formatDateShort(monday)} ~ {formatDateShort(addDays(monday, 5))}
          </span>
        ) : (
          <button
            onClick={() => {
              setWeekOffset(0);
              setSelectedDay(Math.max(0, Math.min(getTodayDayIndex(), 5)));
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/80 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            오늘로
          </button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setWeekOffset((p) => p + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day tabs */}
      <DayTabs
        monday={monday}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        weekOffset={weekOffset}
      />

      {/* Shop tabs */}
      {data && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 mt-4">
          {data.shops.map((shop) => (
            <Button
              key={shop.id}
              variant={selectedShop === shop.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedShop(shop.id)}
              className="shrink-0"
            >
              {shop.name}
            </Button>
          ))}
        </div>
      )}

      {/* Shop info */}
      {!loading && currentShop && (
        <ShopInfoPanel shop={currentShop} />
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">메뉴를 불러오는 중...</p>
        </div>
      )}

      {/* Menu content */}
      {!loading && currentShop && (
        <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as string)}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="daily" className="flex-1">
              일간
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex-1">
              주간
            </TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
            <DailyMenu
              shop={currentShop}
              selectedDay={selectedDay}
            />
          </TabsContent>
          <TabsContent value="weekly">
            <WeeklyMenu
              shop={currentShop}
              selectedDay={selectedDay}
              weekOffset={weekOffset}
            />
          </TabsContent>
        </Tabs>
      )}

      {!loading && data?.shops.length === 0 && (
        <div className="text-center py-20 text-muted-foreground text-sm">
          메뉴 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}

function DayTabs({
  monday,
  selectedDay,
  setSelectedDay,
  weekOffset,
}: {
  monday: Date;
  selectedDay: number;
  setSelectedDay: (d: number) => void;
  weekOffset: number;
}) {
  const todayIdx = getTodayDayIndex();

  return (
    <div className="grid grid-cols-6 gap-1.5">
      {DAYS.map((day, i) => {
        const date = addDays(monday, i);
        const isToday = weekOffset === 0 && i === todayIdx;
        const isSelected = selectedDay === i;

        return (
          <button
            key={day}
            onClick={() => setSelectedDay(i)}
            className={`
              relative flex flex-col items-center gap-0.5 py-2 rounded-xl text-center transition-all
              ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted"
              }
            `}
          >
            <span className="text-[11px] font-medium opacity-70">{day}</span>
            <span className="text-sm font-semibold">{date.getDate()}</span>
            {isToday && !isSelected && (
              <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function DailyMenu({
  shop,
  selectedDay,
}: {
  shop: Shop;
  selectedDay: number;
}) {
  const dayMenu = shop.weeklyMenus[selectedDay];

  if (!dayMenu || dayMenu.items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <UtensilsCrossed className="w-8 h-8 mb-2 opacity-30" />
          <p className="text-sm">등록된 식단이 없습니다.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">운영하지 않거나 아직 등록되지 않았을 수 있습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5">
      {dayMenu.items.map((item, i) => (
        <Card key={i} size="sm">
          <CardContent className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="w-fit">
                {item.category}
              </Badge>
              {item.price && (
                <span className="text-xs text-muted-foreground">{item.price}</span>
              )}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line">{item.category === "천원의 아침밥" ? item.descs.join("\n") : item.descs.join(" ")}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function WeeklyMenu({
  shop,
  selectedDay,
  weekOffset,
}: {
  shop: Shop;
  selectedDay: number;
  weekOffset: number;
}) {
  const todayIdx = getTodayDayIndex();

  const allCategories = Array.from(
    new Set(
      shop.weeklyMenus.flatMap((d) => d.items.map((item) => item.category))
    )
  );

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2.5 border-b text-muted-foreground font-medium w-20">
                구분
              </th>
              {DAYS.map((day, i) => (
                <th
                  key={day}
                  className={`text-left p-2.5 border-b font-medium ${
                    weekOffset === 0 && i === todayIdx
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allCategories.map((cat) => (
              <tr key={cat} className="group">
                <td className="p-2.5 border-b align-top">
                  <Badge variant="secondary" className="text-[11px]">
                    {cat}
                  </Badge>
                </td>
                {DAYS.map((day, i) => {
                  const dayMenu = shop.weeklyMenus[i];
                  const item = dayMenu?.items.find(
                    (it) => it.category === cat
                  );
                  const isToday = weekOffset === 0 && i === todayIdx;
                  return (
                    <td
                      key={day}
                      className={`p-2.5 border-b text-xs align-top leading-relaxed ${
                        isToday ? "bg-primary/5" : ""
                      }`}
                    >
                      {item && item.descs.length > 0 ? (
                        <p className="whitespace-pre-line">{item.category === "천원의 아침밥" ? item.descs.join("\n") : item.descs.join(" ")}</p>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: all days stacked */}
      <div className="md:hidden space-y-5">
        {DAYS.map((day, i) => {
          const dayMenu = shop.weeklyMenus[i];
          const isToday = weekOffset === 0 && i === todayIdx;
          return (
            <div key={day}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-sm font-semibold ${
                    isToday ? "text-primary" : ""
                  }`}
                >
                  {day}요일
                </span>
                {isToday && (
                  <Badge variant="default" className="text-[10px]">
                    오늘
                  </Badge>
                )}
              </div>
              {dayMenu && dayMenu.items.length > 0 ? (
                <div className="space-y-2">
                  {dayMenu.items.map((item, j) => (
                    <Card key={j} size="sm">
                      <CardContent className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="w-fit">
                            {item.category}
                          </Badge>
                          {item.price && (
                            <span className="text-xs text-muted-foreground">{item.price}</span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-line">{item.category === "천원의 아침밥" ? item.descs.join("\n") : item.descs.join(" ")}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-3">
                  등록된 식단이 없습니다.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function ShopInfoPanel({ shop }: { shop: Shop }) {
  const [open, setOpen] = useState(false);
  const { location, hours, phone } = shop.shopInfo;

  if (!location && !hours) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Clock className="w-3.5 h-3.5" />
        <span>운영정보</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <Card size="sm" className="mt-2">
          <CardContent className="flex flex-col gap-3 text-sm">
            {location && (
              <div className="flex gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{location}</span>
              </div>
            )}
            {hours && (
              <div className="flex gap-2">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="whitespace-pre-line text-xs leading-relaxed">{hours}</p>
              </div>
            )}
            {phone && (
              <div className="flex gap-2">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <a href={`tel:${phone}`} className="text-primary hover:underline">
                  {phone}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
