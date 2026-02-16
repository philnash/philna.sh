import type { CollectionEntry } from "astro:content";

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

export function upcomingAppearances(
  appearances: CollectionEntry<"appearances">[],
  today: Date,
) {
  return appearances
    .filter((appearance) => {
      if (appearance.data.event.end_date) {
        return appearance.data.event.end_date >= today;
      }
      return appearance.data.event.start_date >= today;
    })
    .sort(
      (a, b) =>
        a.data.event.start_date.getTime() - b.data.event.start_date.getTime(),
    );
}

export function pastAppearances(
  appearances: CollectionEntry<"appearances">[],
  today: Date,
) {
  return appearances
    .filter((appearance) => {
      if (appearance.data.event.end_date) {
        return appearance.data.event.end_date < today;
      }
      return appearance.data.event.start_date < today;
    })
    .sort(
      (a, b) =>
        b.data.event.start_date.getTime() - a.data.event.start_date.getTime(),
    );
}

export function nextThreeAppearances(
  appearances: CollectionEntry<"appearances">[],
  today: Date,
) {
  return upcomingAppearances(appearances, today).slice(0, 3);
}

export function previousThreeAppearances(
  appearances: CollectionEntry<"appearances">[],
  today: Date,
) {
  return pastAppearances(appearances, today).slice(0, 3);
}
