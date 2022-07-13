import path from "path";

export function parseTranslationDomain(poFilePath: string): string {
  return path.parse(poFilePath).name;
}

export function formatArrayAsBulletedList(list: string[]): string {
  return list
    .map((line) => ` - ${line}`)
    .join("\n");
}