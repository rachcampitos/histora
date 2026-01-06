import { fromByteArray, toByteArray } from 'base64-js';

type Base64EncodeChar = '+' | '/' | '=';
type Base64DecodeChar = '-' | '_';

export class Base64 {
  static encode(plainText: string): string {
    const encodeMap: Record<Base64EncodeChar, string> = { '+': '-', '/': '_', '=': '' };
    return fromByteArray(new Uint8Array(pack(plainText))).replace(/[+/=]/g, (m: string) => {
      return encodeMap[m as Base64EncodeChar] ?? m;
    });
  }

  static decode(b64: string): string {
    const decodeMap: Record<Base64DecodeChar, string> = { '-': '+', '_': '/' };
    b64 = b64.replace(/[-_]/g, (m: string) => {
      return decodeMap[m as Base64DecodeChar] ?? m;
    });
    while (b64.length % 4) {
      b64 += '=';
    }

    return unpack(toByteArray(b64));
  }
}

export function pack(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i));
  }

  return bytes;
}

export function unpack(byteArray: Uint8Array): string {
  return String.fromCharCode(...byteArray);
}

export const base64 = { encode: Base64.encode, decode: Base64.decode };

export function capitalize(text: string): string {
  return (
    text.substring(0, 1).toUpperCase() +
    text.substring(1, text.length).toLowerCase()
  );
}

export function currentTimestamp(): number {
  return Math.ceil(new Date().getTime() / 1000);
}

export function timeLeft(expiredAt: number): number {
  return Math.max(0, expiredAt - currentTimestamp());
}

export function filterObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== null
    )
  ) as Partial<T>;
}

export function isEmptyObject(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}
