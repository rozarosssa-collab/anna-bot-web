import { getMonthStats, getDayStats } from "../../../lib/redis";

const RAILWAY_FIXED = 5.0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "month") {
      const stats = await getMonthStats();
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysPassed = now.getDate();
      const railwayCost = (RAILWAY_FIXED / daysInMonth) * daysPassed;
      return Response.json({ ...stats, railway_cost: railwayCost, railway_full: RAILWAY_FIXED });
    }

    if (type === "day") {
      const year = searchParams.get("year");
      const month = searchParams.get("month");
      const day = searchParams.get("day");
      const stats = await getDayStats(year, month, day);
      return Response.json(stats);
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
