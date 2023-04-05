import type { Appearance } from "../data/appearances.yml";

export function displayDate(startDate: Date, endDate?: Date) {
  if (endDate) {
    const start = startDate.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    });
    const end = endDate.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${start} - ${end}`;
  } else {
    return startDate.toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

export function nextThreeAppearances(appearances: Appearance[], today: Date) {
  return appearances
    .filter((appearance) => appearance.event.start_date >= today)
    .sort((a, b) => a.event.start_date.getTime() - b.event.start_date.getTime())
    .slice(0, 3);
}

export function previousThreeAppearances(
  appearances: Appearance[],
  today: Date
) {
  return appearances
    .filter((appearance) => appearance.event.start_date < today)
    .slice(0, 3);
}
