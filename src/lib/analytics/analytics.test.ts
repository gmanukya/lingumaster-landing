import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test, { mock } from "node:test";
import { debugAdapter } from "./debug";
import { badgeTapEvent, viewEvent } from "./events";
import { noopAdapter } from "./noop";
import { allowlist, serialize } from "./payload";
import { ADAPTER_NAMES, selectAdapter } from "./registry";
import { readPlacement, sendBadgeTap } from "./track";
import type { Event } from "./types";
import { isUmamiWebsiteId, UMAMI_DOMAINS, umamiAdapter, umamiConfig } from "./umami";

const EXAMPLE_WEBSITE_ID = "50533390-5f46-4f32-b670-f4a9db0627ca";

const VIEW = { name: "view", src: "tiktok_bio" } as const;
const TAP = { name: "badge_tap", src: "landing_direct", placement: "final" } as const;

test("the adapter names are noop, debug and umami, and umami stays noop without a UUID", () => {
  assert.deepEqual(ADAPTER_NAMES, ["noop", "debug", "umami"]);
  assert.equal(selectAdapter(undefined), noopAdapter);
  assert.equal(selectAdapter("noop"), noopAdapter);
  assert.equal(selectAdapter(""), noopAdapter);
  assert.equal(selectAdapter("counter"), noopAdapter);
  assert.equal(selectAdapter("plausible"), noopAdapter);
  assert.equal(selectAdapter("umami"), noopAdapter);
  assert.equal(selectAdapter("not-an-adapter"), noopAdapter);
  assert.equal(selectAdapter("debug"), debugAdapter);
});

test("noop send ignores the event and does not touch the network", () => {
  const calls = networkStub();
  try {
    const result = noopAdapter.send(VIEW);
    assert.equal(result, undefined);
    assert.doesNotThrow(() => noopAdapter.send({ name: "nope" } as unknown as Event));
    for (const name of ["counter", "plausible", "umami", "unknown", undefined] as const) {
      selectAdapter(name).send(TAP);
    }
    assert.deepEqual(calls.beacons, []);
    assert.deepEqual(calls.fetches, []);
  } finally {
    calls.restore();
  }
});

test("the allowlist keeps only name, src and placement", () => {
  const view = allowlist({
    name: "view",
    src: "tiktok_bio",
    placement: "hero",
    url: "https://lingumaster.app/?src=tiktok_bio",
    referrer: "https://www.tiktok.com/",
    userAgent: "Mozilla/5.0",
    id: "user-1",
    timestamp: "2026-10-24T07:43:00.000Z",
  });
  assert.deepEqual(view, { name: "view", src: "tiktok_bio" });
  assert.equal(view && "placement" in view, false);
  assert.equal(serialize(view!), '{"name":"view","src":"tiktok_bio"}');

  const tap = allowlist({
    name: "badge_tap",
    src: "landing_direct",
    placement: "hero",
    href: "https://apps.apple.com/fr/app/id6504011014",
  });
  assert.deepEqual(tap, { name: "badge_tap", src: "landing_direct", placement: "hero" });
  assert.deepEqual(Object.keys(tap!), ["name", "src", "placement"]);
  assert.equal(
    serialize(tap!),
    '{"name":"badge_tap","src":"landing_direct","placement":"hero"}',
  );
});

test("events outside the allowlist are dropped", () => {
  assert.equal(allowlist(null), null);
  assert.equal(allowlist("view"), null);
  assert.equal(allowlist({ name: "purchase", src: "tiktok_bio" }), null);
  assert.equal(allowlist({ name: "view", src: "evil" }), null);
  assert.deepEqual(allowlist({ name: "view", src: "tiktok_bio", placement: "side" }), {
    name: "view",
    src: "tiktok_bio",
  });
  assert.equal(allowlist({ name: "badge_tap", src: "tiktok_bio" }), null);
  assert.equal(allowlist({ name: "badge_tap", src: "tiktok_bio", placement: "nav" }), null);
  assert.equal(allowlist({ name: "view" }), null);
});

test("src falls back to landing_direct unless it is exactly tiktok_bio", () => {
  assert.deepEqual(viewEvent("?src=tiktok_bio"), { name: "view", src: "tiktok_bio" });
  assert.deepEqual(viewEvent("?src=evil"), { name: "view", src: "landing_direct" });
  assert.deepEqual(viewEvent(""), { name: "view", src: "landing_direct" });
  assert.deepEqual(viewEvent("?src="), { name: "view", src: "landing_direct" });
  assert.deepEqual(viewEvent("?src=%3Cscript%3E"), { name: "view", src: "landing_direct" });
  assert.deepEqual(badgeTapEvent("hero", "?src=tiktok_bio"), {
    name: "badge_tap",
    src: "tiktok_bio",
    placement: "hero",
  });
  assert.deepEqual(badgeTapEvent("final", "?src=evil"), {
    name: "badge_tap",
    src: "landing_direct",
    placement: "final",
  });
  assert.deepEqual(badgeTapEvent("final", ""), {
    name: "badge_tap",
    src: "landing_direct",
    placement: "final",
  });
});

test("src is read from location.search when the caller does not pass it", () => {
  const previous = globalThis.location;
  Object.defineProperty(globalThis, "location", {
    configurable: true,
    value: { search: "?src=tiktok_bio" },
  });
  try {
    assert.equal(viewEvent().src, "tiktok_bio");
    assert.equal(badgeTapEvent("hero").src, "tiktok_bio");
  } finally {
    if (previous === undefined) {
      delete (globalThis as { location?: Location }).location;
    } else {
      Object.defineProperty(globalThis, "location", { configurable: true, value: previous });
    }
  }
});

test("debug logs the allowlisted payload and beacons only that JSON", () => {
  const calls = networkStub();
  const logs: unknown[][] = [];
  const info = console.info;
  console.info = (...args: unknown[]) => {
    logs.push(args);
  };
  const previousAnalytics = process.env.NEXT_PUBLIC_ANALYTICS;
  const previousEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  process.env.NEXT_PUBLIC_ANALYTICS = "debug";
  process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = "http://127.0.0.1:4174/collect";
  try {
    const result = debugAdapter.send({
      ...VIEW,
      url: "https://example.test",
      referrer: "https://tiktok.com",
    } as Event);
    assert.equal(result, undefined);
    assert.equal(logs.length, 1);
    assert.deepEqual(logs[0]?.[1], { name: "view", src: "tiktok_bio" });
    assert.deepEqual(calls.beacons, [
      {
        url: "http://127.0.0.1:4174/collect",
        body: '{"name":"view","src":"tiktok_bio"}',
      },
    ]);
    assert.deepEqual(calls.fetches, []);

    debugAdapter.send(TAP);
    assert.equal(calls.beacons[1]?.body, '{"name":"badge_tap","src":"landing_direct","placement":"final"}');
    assert.deepEqual(Object.keys(JSON.parse(calls.beacons[1]!.body)), ["name", "src", "placement"]);
  } finally {
    console.info = info;
    restoreEnv("NEXT_PUBLIC_ANALYTICS", previousAnalytics);
    restoreEnv("NEXT_PUBLIC_ANALYTICS_ENDPOINT", previousEndpoint);
    calls.restore();
  }
});

test("debug does not beacon when no endpoint is set, and stays quiet for other adapters", () => {
  const calls = networkStub();
  const info = console.info;
  console.info = () => {};
  const previousAnalytics = process.env.NEXT_PUBLIC_ANALYTICS;
  const previousEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  delete process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  try {
    process.env.NEXT_PUBLIC_ANALYTICS = "debug";
    debugAdapter.send(VIEW);
    assert.deepEqual(calls.beacons, []);
    assert.deepEqual(calls.fetches, []);

    process.env.NEXT_PUBLIC_ANALYTICS = "noop";
    process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = "http://127.0.0.1:4174/collect";
    debugAdapter.send(VIEW);
    assert.deepEqual(calls.beacons, []);
    assert.deepEqual(calls.fetches, []);
  } finally {
    console.info = info;
    restoreEnv("NEXT_PUBLIC_ANALYTICS", previousAnalytics);
    restoreEnv("NEXT_PUBLIC_ANALYTICS_ENDPOINT", previousEndpoint);
    calls.restore();
  }
});

test("a failing beacon or console does not throw, and fetch is not awaited", async () => {
  const previousAnalytics = process.env.NEXT_PUBLIC_ANALYTICS;
  const previousEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  const info = console.info;
  process.env.NEXT_PUBLIC_ANALYTICS = "debug";
  process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = "http://127.0.0.1:9/collect";
  console.info = () => {
    throw new Error("console broken");
  };
  let settled = false;
  const fetchCalls: Array<{ url: string; init: RequestInit }> = [];
  const previousNavigator = globalThis.navigator;
  const previousFetch = globalThis.fetch;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      sendBeacon() {
        throw new Error("beacon blocked");
      },
    },
  });
  globalThis.fetch = ((url: string, init: RequestInit) => {
    fetchCalls.push({ url: String(url), init });
    return new Promise((resolve) => {
      setTimeout(() => {
        settled = true;
        resolve(new Response(null, { status: 204 }));
      }, 30);
    });
  }) as typeof fetch;
  const rejections: unknown[] = [];
  const onRejection = (reason: unknown) => {
    rejections.push(reason);
  };
  process.on("unhandledRejection", onRejection);
  try {
    const started = Date.now();
    assert.doesNotThrow(() => debugAdapter.send(VIEW));
    assert.equal(Date.now() - started < 25, true);
    assert.equal(fetchCalls.length, 1);
    assert.equal(fetchCalls[0]?.init.keepalive, true);
    assert.equal(fetchCalls[0]?.init.credentials, "omit");
    assert.equal(fetchCalls[0]?.init.method, "POST");
    assert.equal(fetchCalls[0]?.init.body, '{"name":"view","src":"tiktok_bio"}');
    assert.equal(settled, false);
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.equal(settled, true);
    assert.deepEqual(rejections, []);
  } finally {
    process.off("unhandledRejection", onRejection);
    console.info = info;
    globalThis.fetch = previousFetch;
    if (previousNavigator === undefined) {
      delete (globalThis as { navigator?: Navigator }).navigator;
    } else {
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: previousNavigator,
      });
    }
    restoreEnv("NEXT_PUBLIC_ANALYTICS", previousAnalytics);
    restoreEnv("NEXT_PUBLIC_ANALYTICS_ENDPOINT", previousEndpoint);
  }
});

test("fetch is used when sendBeacon is missing or refuses the payload", () => {
  const previousAnalytics = process.env.NEXT_PUBLIC_ANALYTICS;
  const previousEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  process.env.NEXT_PUBLIC_ANALYTICS = "debug";
  process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = "http://127.0.0.1:4174/collect";
  const info = console.info;
  console.info = () => {};
  const previousNavigator = globalThis.navigator;
  const previousFetch = globalThis.fetch;
  const fetches: string[] = [];
  globalThis.fetch = ((url: string) => {
    fetches.push(String(url));
    return Promise.resolve(new Response(null, { status: 204 }));
  }) as typeof fetch;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      sendBeacon() {
        return false;
      },
    },
  });
  try {
    debugAdapter.send(TAP);
    assert.deepEqual(fetches, ["http://127.0.0.1:4174/collect"]);
  } finally {
    console.info = info;
    globalThis.fetch = previousFetch;
    if (previousNavigator === undefined) {
      delete (globalThis as { navigator?: Navigator }).navigator;
    } else {
      Object.defineProperty(globalThis, "navigator", {
        configurable: true,
        value: previousNavigator,
      });
    }
    restoreEnv("NEXT_PUBLIC_ANALYTICS", previousAnalytics);
    restoreEnv("NEXT_PUBLIC_ANALYTICS_ENDPOINT", previousEndpoint);
  }
});

test("invalid debug events are dropped without throwing", () => {
  const calls = networkStub();
  const previousAnalytics = process.env.NEXT_PUBLIC_ANALYTICS;
  const previousEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  process.env.NEXT_PUBLIC_ANALYTICS = "debug";
  process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT = "http://127.0.0.1:4174/collect";
  try {
    assert.doesNotThrow(() => debugAdapter.send({ name: "view", src: "evil" } as unknown as Event));
    assert.deepEqual(calls.beacons, []);
  } finally {
    restoreEnv("NEXT_PUBLIC_ANALYTICS", previousAnalytics);
    restoreEnv("NEXT_PUBLIC_ANALYTICS_ENDPOINT", previousEndpoint);
    calls.restore();
  }
});

test("badge taps read hero and final from data-placement and ignore anything else", () => {
  const hero = slot("hero");
  const nested = { closest: () => hero };
  const final = { parentElement: slot("final") };
  assert.equal(readPlacement(hero as unknown as EventTarget), "hero");
  assert.equal(readPlacement(nested as unknown as EventTarget), "hero");
  assert.equal(readPlacement(final as unknown as EventTarget), "final");
  assert.equal(readPlacement(slot("side") as unknown as EventTarget), null);
  assert.equal(readPlacement(null), null);
  assert.doesNotThrow(() => sendBadgeTap(null));
  assert.doesNotThrow(() => sendBadgeTap(slot(null) as unknown as EventTarget));
});

test("umami is selected only when the public env var is umami and the website id is a UUID", () => {
  const previousAnalytics = process.env.NEXT_PUBLIC_ANALYTICS;
  const previousId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const previousDomains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS;
  try {
    delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
    delete process.env.NEXT_PUBLIC_UMAMI_DOMAINS;
    process.env.NEXT_PUBLIC_ANALYTICS = "umami";
    assert.equal(umamiConfig(), null);
    assert.equal(selectAdapter("umami"), noopAdapter);

    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = "not-a-uuid";
    assert.equal(isUmamiWebsiteId(process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID), false);
    assert.equal(selectAdapter("umami"), noopAdapter);

    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = EXAMPLE_WEBSITE_ID;
    assert.equal(selectAdapter("umami"), umamiAdapter);
    assert.deepEqual(umamiConfig(), { websiteId: EXAMPLE_WEBSITE_ID, domains: UMAMI_DOMAINS });

    process.env.NEXT_PUBLIC_UMAMI_DOMAINS = "preview.example";
    assert.equal(umamiConfig()?.domains, "preview.example");

    process.env.NEXT_PUBLIC_ANALYTICS = "noop";
    assert.equal(selectAdapter("umami"), noopAdapter);
    assert.equal(umamiConfig(), null);
  } finally {
    restoreEnv("NEXT_PUBLIC_ANALYTICS", previousAnalytics);
    restoreEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID", previousId);
    restoreEnv("NEXT_PUBLIC_UMAMI_DOMAINS", previousDomains);
  }
});

test("badge_tap sends only src and placement, and view uses the normalised url", () => {
  const previousAnalytics = process.env.NEXT_PUBLIC_ANALYTICS;
  const previousId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  process.env.NEXT_PUBLIC_ANALYTICS = "umami";
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = EXAMPLE_WEBSITE_ID;
  const calls: unknown[][] = [];
  const previousUmami = (globalThis as { umami?: unknown }).umami;
  (globalThis as { umami?: { track: (...args: unknown[]) => void } }).umami = {
    track(...args: unknown[]) {
      calls.push(args);
    },
  };
  try {
    umamiAdapter.send({
      name: "badge_tap",
      src: "tiktok_bio",
      placement: "hero",
      href: "https://apps.apple.com/fr/app/id6504011014",
      id: "user-1",
    } as Event);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.[0], "badge_tap");
    assert.deepEqual(calls[0]?.[1], { src: "tiktok_bio", placement: "hero" });
    assert.deepEqual(Object.keys(calls[0]?.[1] as object), ["src", "placement"]);

    umamiAdapter.send(viewEvent("?src=evil"));
    const view = calls[1]?.[0];
    assert.equal(typeof view, "function");
    const props = (view as (value: Record<string, unknown>) => Record<string, unknown>)({
      website: EXAMPLE_WEBSITE_ID,
      url: "/?src=evil",
      hostname: "lingumaster.app",
    });
    assert.equal(props.url, "/");
    assert.equal(props.website, EXAMPLE_WEBSITE_ID);
    assert.equal("name" in props, false);

    umamiAdapter.send({ name: "view", src: "tiktok_bio" });
    const tiktok = calls[2]?.[0] as (value: Record<string, unknown>) => Record<string, unknown>;
    assert.equal(tiktok({ url: "/" }).url, "/?src=tiktok_bio");

    umamiAdapter.send({ name: "view", src: "evil" } as unknown as Event);
    umamiAdapter.send({ name: "badge_tap", src: "tiktok_bio" } as Event);
    assert.equal(calls.length, 3);
  } finally {
    if (previousUmami === undefined) delete (globalThis as { umami?: unknown }).umami;
    else (globalThis as { umami?: unknown }).umami = previousUmami;
    restoreEnv("NEXT_PUBLIC_ANALYTICS", previousAnalytics);
    restoreEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID", previousId);
  }
});

test("a missing window.umami retries three times, 500 ms apart, then drops", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  const previousAnalytics = process.env.NEXT_PUBLIC_ANALYTICS;
  const previousId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  process.env.NEXT_PUBLIC_ANALYTICS = "umami";
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = EXAMPLE_WEBSITE_ID;
  delete (globalThis as { umami?: unknown }).umami;
  const calls: string[] = [];
  try {
    const started = Date.now();
    assert.doesNotThrow(() => umamiAdapter.send({ name: "view", src: "landing_direct" }));
    assert.equal(Date.now() - started < 50, true);
    assert.equal(calls.length, 0);
    mock.timers.tick(500);
    mock.timers.tick(500);
    (globalThis as { umami?: { track: () => void } }).umami = {
      track() {
        calls.push("late");
      },
    };
    mock.timers.tick(500);
    assert.deepEqual(calls, ["late"]);
    mock.timers.tick(5000);
    assert.deepEqual(calls, ["late"]);

    delete (globalThis as { umami?: unknown }).umami;
    calls.length = 0;
    umamiAdapter.send({ name: "badge_tap", src: "landing_direct", placement: "final" });
    mock.timers.tick(500);
    mock.timers.tick(500);
    mock.timers.tick(500);
    (globalThis as { umami?: { track: () => void } }).umami = {
      track() {
        calls.push("too-late");
      },
    };
    mock.timers.tick(5000);
    assert.deepEqual(calls, []);
  } finally {
    delete (globalThis as { umami?: unknown }).umami;
    mock.timers.reset();
    restoreEnv("NEXT_PUBLIC_ANALYTICS", previousAnalytics);
    restoreEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID", previousId);
  }
});

test("umami send stays quiet when the id is missing and never calls fetch", () => {
  const calls = networkStub();
  const previousAnalytics = process.env.NEXT_PUBLIC_ANALYTICS;
  const previousId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  delete process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  process.env.NEXT_PUBLIC_ANALYTICS = "umami";
  let tracked = 0;
  (globalThis as { umami?: { track: () => void } }).umami = {
    track() {
      tracked += 1;
    },
  };
  try {
    assert.doesNotThrow(() => umamiAdapter.send(VIEW));
    assert.equal(tracked, 0);
    assert.deepEqual(calls.beacons, []);
    assert.deepEqual(calls.fetches, []);
    (globalThis as { umami?: { track: () => never } }).umami = {
      track() {
        throw new Error("tracker failed");
      },
    };
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = EXAMPLE_WEBSITE_ID;
    assert.doesNotThrow(() => umamiAdapter.send(TAP));
  } finally {
    delete (globalThis as { umami?: unknown }).umami;
    restoreEnv("NEXT_PUBLIC_ANALYTICS", previousAnalytics);
    restoreEnv("NEXT_PUBLIC_UMAMI_WEBSITE_ID", previousId);
    calls.restore();
  }
});

test("the page does not use data-umami-event, and the 404 page does not mount Analytics", () => {
  const root = path.resolve("src");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx|css)$/.test(name) && !name.endsWith(".test.ts")) files.push(full);
    }
  };
  walk(root);
  const offenders = files.filter((file) => fs.readFileSync(file, "utf8").includes("data-umami-event"));
  assert.deepEqual(offenders, []);
  assert.equal(fs.readFileSync(path.resolve("src/app/page.tsx"), "utf8").includes("Analytics"), true);
  assert.equal(fs.readFileSync(path.resolve("src/app/not-found.tsx"), "utf8").includes("Analytics"), false);
  assert.equal(fs.readFileSync(path.resolve("src/components/NotFoundPage.tsx"), "utf8").includes("Analytics"), false);
  const adapter = fs.readFileSync(path.resolve("src/lib/analytics/umami.ts"), "utf8");
  assert.equal(adapter.includes("cloud.umami.is"), false);
  assert.equal(adapter.includes("gateway.umami.is"), false);
  assert.equal(adapter.includes(EXAMPLE_WEBSITE_ID), false);
});

function slot(placement: string | null) {
  return {
    closest(selector: string) {
      if (selector === "[data-placement]" && placement) return this;
      return null;
    },
    getAttribute(name: string) {
      return name === "data-placement" ? placement : null;
    },
  };
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function networkStub() {
  const beacons: Array<{ url: string; body: string }> = [];
  const fetches: Array<{ url: string; body: string }> = [];
  const previousNavigator = globalThis.navigator;
  const previousFetch = globalThis.fetch;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      sendBeacon(url: string, body: string) {
        beacons.push({ url: String(url), body: String(body) });
        return true;
      },
    },
  });
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    fetches.push({ url: String(url), body: String(init?.body ?? "") });
    return Promise.resolve(new Response(null, { status: 204 }));
  }) as typeof fetch;
  return {
    beacons,
    fetches,
    restore() {
      globalThis.fetch = previousFetch;
      if (previousNavigator === undefined) {
        delete (globalThis as { navigator?: Navigator }).navigator;
      } else {
        Object.defineProperty(globalThis, "navigator", {
          configurable: true,
          value: previousNavigator,
        });
      }
    },
  };
}
