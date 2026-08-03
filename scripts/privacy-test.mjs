#!/usr/bin/env node
/**
 * Backend privacy test — verifies row-level security on the user data tables.
 *
 * Run:  node scripts/privacy-test.mjs
 *
 * Phase 1 (always runs, no credentials needed):
 *   an anonymous Data API client must not be able to read or write any row.
 *
 * Phase 2 (runs when two test accounts are provided):
 *   set PRIVACY_TEST_A_EMAIL / PRIVACY_TEST_A_PASSWORD and
 *       PRIVACY_TEST_B_EMAIL / PRIVACY_TEST_B_PASSWORD
 *   User A signs in and tries to read and write User B's rows — every table
 *   must return zero rows for B and reject writes targeting B.
 */

import { readFileSync } from "node:fs";

function loadEnv() {
  try {
    for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* .env is optional */
  }
}
loadEnv();

const URL_BASE = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
if (!URL_BASE || !ANON) {
  console.error("Missing backend URL / publishable key.");
  process.exit(1);
}

const TABLES = [
  { table: "profiles", owner: "id" },
  { table: "saved_words", owner: "user_id" },
  { table: "search_history", owner: "user_id" },
  { table: "activity_days", owner: "user_id" },
  { table: "user_preferences", owner: "user_id" },
  { table: "push_tokens", owner: "user_id" },
];

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

function headers(token) {
  return {
    apikey: ANON,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function rest(path, token, init = {}) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(token), ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function signIn(email, password) {
  const res = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description ?? json.msg ?? "sign-in failed");
  return { token: json.access_token, userId: json.user.id };
}

console.log(`\n== Phase 1: anonymous access is denied ==`);
for (const { table } of TABLES) {
  const read = await rest(`${table}?select=*&limit=1`, null);
  check(
    `anon cannot read ${table}`,
    read.status >= 400 || (Array.isArray(read.body) && read.body.length === 0),
    `status ${read.status}`,
  );
  const write = await rest(table, null, { method: "POST", body: JSON.stringify({}) });
  check(`anon cannot write ${table}`, write.status >= 400, `status ${write.status}`);
}

const a = process.env.PRIVACY_TEST_A_EMAIL;
const b = process.env.PRIVACY_TEST_B_EMAIL;
if (a && b && process.env.PRIVACY_TEST_A_PASSWORD && process.env.PRIVACY_TEST_B_PASSWORD) {
  console.log(`\n== Phase 2: cross-user isolation ==`);
  const userA = await signIn(a, process.env.PRIVACY_TEST_A_PASSWORD);
  const userB = await signIn(b, process.env.PRIVACY_TEST_B_PASSWORD);

  for (const { table, owner } of TABLES) {
    const cross = await rest(`${table}?select=*&${owner}=eq.${userB.userId}`, userA.token);
    check(
      `A cannot read B's ${table}`,
      Array.isArray(cross.body) && cross.body.length === 0,
      `status ${cross.status}, rows ${Array.isArray(cross.body) ? cross.body.length : "n/a"}`,
    );

    const all = await rest(`${table}?select=${owner}`, userA.token);
    check(
      `${table} only ever returns A's own rows`,
      Array.isArray(all.body) && all.body.every((row) => row[owner] === userA.userId),
      `rows ${Array.isArray(all.body) ? all.body.length : "n/a"}`,
    );
  }

  const forgedWrite = await rest("saved_words", userA.token, {
    method: "POST",
    body: JSON.stringify({ user_id: userB.userId, word: "privacy-probe", definition: "x" }),
  });
  check("A cannot insert a row owned by B", forgedWrite.status >= 400, `status ${forgedWrite.status}`);

  const forgedUpdate = await rest(`profiles?id=eq.${userB.userId}`, userA.token, {
    method: "PATCH",
    body: JSON.stringify({ name: "hacked" }),
  });
  check(
    "A cannot update B's profile",
    forgedUpdate.status >= 400 || (Array.isArray(forgedUpdate.body) && forgedUpdate.body.length === 0),
    `status ${forgedUpdate.status}`,
  );
} else {
  console.log(
    "\n== Phase 2 skipped == set PRIVACY_TEST_A_EMAIL/PASSWORD and PRIVACY_TEST_B_EMAIL/PASSWORD to run cross-user checks.",
  );
}

console.log(`\n${failures === 0 ? "All privacy checks passed." : `${failures} check(s) FAILED.`}`);
process.exit(failures === 0 ? 1 && 0 : 1);
