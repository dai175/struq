// SQL LIKE のメタ文字をリテラルとして扱わせる。呼び出し側は `ESCAPE '\\'` を必ず併用する。
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}
