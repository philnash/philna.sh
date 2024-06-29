import type { Appearance } from "../data/appearances.yml";

export function displayDate(startDate: Date, endDate?: Date) {
  if (endDate && startDate.getTime() !== endDate.getTime()) {
    const start = startDate.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      timeZone: "Etc/UTC",
    });
    const end = endDate.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Etc/UTC",
    });
    return `${start} - ${end}`;
  } else {
    return startDate.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Etc/UTC",
    });
  }
}

export function getToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function upcomingAppearances(appearances: Appearance[], today: Date) {
  return appearances
    .filter((appearance) => {
      if (appearance.event.end_date) {
        return appearance.event.end_date >= today;
      }
      return appearance.event.start_date >= today;
    })
    .sort(
      (a, b) => a.event.start_date.getTime() - b.event.start_date.getTime()
    );
}

export function pastAppearances(appearances: Appearance[], today: Date) {
  return appearances
    .filter((appearance) => {
      if (appearance.event.end_date) {
        return appearance.event.end_date < today;
      }
      return appearance.event.start_date < today;
    })
    .sort(
      (a, b) => b.event.start_date.getTime() - a.event.start_date.getTime()
    );
}

export function nextThreeAppearances(appearances: Appearance[], today: Date) {
  return upcomingAppearances(appearances, today).slice(0, 3);
}

export function previousThreeAppearances(
  appearances: Appearance[],
  today: Date
) {
  return pastAppearances(appearances, today).slice(0, 3);
}
