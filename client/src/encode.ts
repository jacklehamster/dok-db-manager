import jsSHA from "jssha";

export function encodeSecret(secretWord?: string): string {
  return new jsSHA("SHA-256", "TEXT", { encoding: "UTF8" })
    .update(secretWord ?? "")
    .getHash("HEX");
}
