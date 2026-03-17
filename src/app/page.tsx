import { fetchMenu } from "@/lib/menu";
import MenuClient from "./MenuClient";

function getMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const d = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const revalidate = 3600;

export default async function Home() {
  const mondayStr = getMonday();
  const data = await fetchMenu(mondayStr);

  return <MenuClient initialData={data} />;
}
