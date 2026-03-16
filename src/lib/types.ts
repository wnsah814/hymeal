export interface MenuItem {
  category: string;
  title: string;
  desc: string;
  price: string;
}

export interface WeeklyMenuItem {
  category: string;
  descs: string[];
  price: string;
}

export interface WeeklyDayMenu {
  day: string;
  items: WeeklyMenuItem[];
}

export interface Shop {
  id: string;
  code: string;
  name: string;
  date: string;
  todayMenus: MenuItem[];
  weeklyMenus: WeeklyDayMenu[];
  info: string;
}

export interface MenuResponse {
  shops: Shop[];
  weekStartDate: string;
  fetchedAt: string;
}
