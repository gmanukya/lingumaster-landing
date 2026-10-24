import assert from "node:assert/strict";
import test from "node:test";
import { debugAdapter } from "./debug";
import { badgeTapEvent, viewEvent } from "./events";
import { noopAdapter } from "./noop";
import { allowlist, serialize } from "./payload";
import { ADAPTER_NAMES, selectAdapter } from "./registry";
import { readPlacement, sendBadgeTap } from "./track";
import type { Event } from "./types";

const VIEW = { name: "view", src: "tiktok_bio" } as const;
const TAP = { name: "badge_tap", src: "landing_direct", placement: "final" } as const;

test("the adapter names are the env var values, and only noop and debug are built", () => {
  assert.deepEqual(ADAPTER_NAMES, ["noop", "debug", "counter", "plausible", "umami"]);
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
