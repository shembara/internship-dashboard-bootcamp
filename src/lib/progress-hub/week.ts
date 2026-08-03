export const progressHubTimeZone = "Europe/Uzhgorod";

export type WeekState = "current" | "past" | "future";

export type WeekPeriod = {
  key: string;
  startDate: string;
  endDate: string;
  label: string;
  state: WeekState;
};

const weekKeyPattern = /^(\d{4})-W(\d{2})$/;

function localDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: progressHubTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<"year" | "month" | "day", number>;
  return new Date(Date.UTC(values.year, values.month - 1, values.day));
}

function isoWeekStart(date: Date) {
  const day = date.getUTCDay() || 7;
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - day + 1);
  return start;
}

function isoWeekKey(date: Date) {
  const thursday = new Date(date);
  thursday.setUTCDate(thursday.getUTCDate() + 4 - (thursday.getUTCDay() || 7));
  const year = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  firstThursday.setUTCDate(
    firstThursday.getUTCDate() + 4 - (firstThursday.getUTCDay() || 7),
  );
  const week =
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / 604800000);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function startForWeekKey(key: string) {
  const match = weekKeyPattern.exec(key);
  if (!match) throw new Error("Invalid week key.");
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (week < 1 || week > 53) throw new Error("Invalid week key.");

  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const weekOneStart = isoWeekStart(januaryFourth);
  const start = new Date(weekOneStart);
  start.setUTCDate(start.getUTCDate() + (week - 1) * 7);
  if (isoWeekKey(start) !== key) throw new Error("Invalid week key.");
  return start;
}

function weekLabel(start: Date, end: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getCurrentWeek(now = new Date()): WeekPeriod {
  const start = isoWeekStart(localDateParts(now));
  return getWeekPeriod(isoWeekKey(start), now);
}

export function getWeekPeriod(key: string, now = new Date()): WeekPeriod {
  const start = startForWeekKey(key);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const currentKey = isoWeekKey(isoWeekStart(localDateParts(now)));
  const currentStart = startForWeekKey(currentKey);
  const state: WeekState =
    start.getTime() === currentStart.getTime()
      ? "current"
      : start.getTime() < currentStart.getTime()
        ? "past"
        : "future";
  return {
    key,
    startDate: dateKey(start),
    endDate: dateKey(end),
    label: weekLabel(start, end),
    state,
  };
}

export function assertWritableWeek(key: string, now = new Date()) {
  const week = getWeekPeriod(key, now);
  if (week.state === "future") throw new Error("Future weeks are not available yet.");
  return week;
}
