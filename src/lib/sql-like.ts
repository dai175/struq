// Escape LIKE metacharacters so user input like "50%" matches literally rather
// than acting as a wildcard. Callers must pair this with `ESCAPE '\\'` in the SQL.
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
