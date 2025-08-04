// helpers/fetchWithCookies.ts
import fetchCookie from "fetch-cookie";
import { CookieJar } from "tough-cookie";

export const cookieJar = new CookieJar();
export const fetchWithCookies = fetchCookie(globalThis.fetch, cookieJar);
