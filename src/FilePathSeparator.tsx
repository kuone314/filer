

///////////////////////////////////////////////////////////////////////////////////////////////////
export const SEPARATOR = {
  slash: "/",
  back_slash: "\\",
} as const;
export type separator = typeof SEPARATOR[keyof typeof SEPARATOR];

export function ApplySeparator(path: string, separator: separator): string {
  return path
    .replace(/\//g, separator)
    .replace(/\\/g, separator)
}
