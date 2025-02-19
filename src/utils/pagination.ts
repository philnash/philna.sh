import type { Page } from "astro";

/**
 * Takes a page and returns the page numbers that should be rendered.
 *
 * @param page {Page} The current page
 * @param windowSize {number} The number of page numbers that will be shown. It's best to choose an odd number.
 * @returns number[]
 */
export function getPageNumbers(page: Page, windowSize: number = 5): number[] {
  // We start with the range running from 1 to the total number of pages. We'll use the windowSize to cut this down to a range that we can display comfortably
  let first = 1;
  let last = page.lastPage;
  // The number of numbers to the left or right of the centre number
  const halfWindowSize = Math.floor(windowSize / 2);
  // The distance between the current page and the last page
  const rightMargin = page.lastPage - page.currentPage;

  // If the current page is less than or equal to half the window size then there will be no gap between the first page and the range. We can set the last page to the length of the window.
  if (page.currentPage <= halfWindowSize) {
    // If the windowSize is less than the number of pages then the last page will be the windowSize itself, otherwise it remains the last page that we get from the Page object
    if (page.lastPage > windowSize) {
      last = windowSize;
    }
    // If the rightMargin is less than the halfWindowSize then there will be no gap between the last page and the range.
  } else if (rightMargin <= halfWindowSize) {
    // We set the first page in the range to be last page minus the windowSize unless that takes us beyond the first page.
    first = Math.max(page.lastPage - windowSize, first);
    // The else condition means the range is between the first and last pages.
  } else {
    first = Math.max(page.currentPage - halfWindowSize, first);
    last = Math.min(page.currentPage + halfWindowSize, last);
  }
  // Using the first and last page numbers, we now generate an array of all the page numbers that we will display
  const pageNumbers = Array(last - first + 1)
    .fill(0)
    .map((_, index) => first + index);
  return pageNumbers;
}

export function urlPatternToUrl(
  pattern: string,
  pageNumber: number,
  firstPageUrl?: string,
) {
  if (pageNumber === 1) {
    if (firstPageUrl) {
      return firstPageUrl;
    }
    return pattern.replace("{}", "");
  }
  return pattern.replace("{}", pageNumber.toString());
}
