import { toString } from "mdast-util-to-string";
import { fromMarkdown } from "mdast-util-from-markdown";

export function truncate(text: string | undefined, numberOfCharacters: number) {
  if (!text) {
    return "";
  }
  const plainText = toString(fromMarkdown(text));
  if (plainText.length <= numberOfCharacters) {
    return plainText;
  }
  const subString = plainText.slice(0, numberOfCharacters - 1);
  return `${subString.slice(0, subString.lastIndexOf(" "))}...`;
}
