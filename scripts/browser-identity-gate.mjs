import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve, sep } from "node:path";
import { promisify } from "node:util";
import {
  connectCdp,
  elementCenterAfterScroll,
  hasVisibleFocusIndicator,
  withTimeoutCleanup,
} from "./browser-gate-lib.mjs";

const APP_URL = new URL(
  process.env.APP_URL ?? "http://127.0.0.1:3000/entrar",
);
const SCREENSHOT_PATH = process.env.SCREENSHOT_PATH;
const CHROME_PATH =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const execFileAsync = promisify(execFile);
const runs = [];

const wait = (milliseconds) =>
  new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

function assertLocalUrl(url, label) {
  assert.equal(url.protocol, "http:", `${label} must use local HTTP`);
  assert.ok(
    ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname),
    `${label} must point to a loopback host`,
  );
}

async function loadLocalSupabase() {
  const cli = join(
    process.cwd(),
    "node_modules",
    "supabase",
    "dist",
    "supabase.js",
  );
  const { stdout } = await execFileAsync(
    process.execPath,
    [cli, "status", "-o", "json"],
    { encoding: "utf8", timeout: 10_000, windowsHide: true },
  );
  const firstBrace = stdout.indexOf("{");
  const lastBrace = stdout.lastIndexOf("}");
  assert.ok(firstBrace >= 0 && lastBrace > firstBrace);
  const status = JSON.parse(stdout.slice(firstBrace, lastBrace + 1));
  assert.equal(typeof status.API_URL, "string");
  assert.equal(typeof status.SERVICE_ROLE_KEY, "string");
  const apiUrl = new URL(status.API_URL);
  assertLocalUrl(apiUrl, "Supabase API_URL");

  return { apiUrl, serviceRoleKey: status.SERVICE_ROLE_KEY };
}

async function localRequest(
  supabase,
  pathname,
  { body, method = "GET" } = {},
) {
  const response = await fetch(new URL(`/auth/v1/admin${pathname}`, supabase.apiUrl), {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      apikey: supabase.serviceRoleKey,
      authorization: `Bearer ${supabase.serviceRoleKey}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    method,
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error(`Local Supabase ${method} ${pathname} failed (${response.status})`);
  }
  if (response.status === 204) return undefined;
  return response.json();
}

async function verifyLocalIdentityRemoved(userId) {
  assert.match(
    userId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  );
  const query = `select
    (select count(*) from auth.users where id = '${userId}') +
    (select count(*) from public.profiles where user_id = '${userId}') +
    (select count(*) from public.preferences where user_id = '${userId}') +
    (select count(*) from public.audit_events where user_id = '${userId}');`;
  const { stdout } = await execFileAsync(
    "docker",
    [
      "exec",
      "supabase_db_foundation-today",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-At",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      query,
    ],
    { encoding: "utf8", timeout: 10_000, windowsHide: true },
  );
  assert.equal(stdout.trim(), "0", "ephemeral identity data still exists");
}

async function listLocalUsers(supabase) {
  const data = await localRequest(supabase, "/users?page=1&per_page=1000");
  return data.users;
}

async function createLocalIdentity(supabase, identity) {
  const user = await localRequest(supabase, "/users", {
    body: {
      email: identity.email,
      email_confirm: true,
      password: identity.password,
    },
    method: "POST",
  });
  assert.equal(typeof user.id, "string");
  identity.id = user.id;
}

async function cleanupLocalIdentity(supabase, identity) {
  let userId = identity.id;

  try {
    const existing = (await listLocalUsers(supabase)).find(
      (user) => user.email === identity.email,
    );
    userId ??= existing?.id;

    if (existing) {
      await localRequest(supabase, `/users/${existing.id}`, {
        method: "DELETE",
      });
    }

    const authUser = (await listLocalUsers(supabase)).find(
      (user) => user.id === userId || user.email === identity.email,
    );
    assert.equal(authUser, undefined, "ephemeral auth user still exists");

    if (userId) {
      await verifyLocalIdentityRemoved(userId);
    }
  } catch (error) {
    throw new Error(
      `Cleanup failed for local auth user ${userId ?? "unknown"}: ${error.message}`,
      { cause: error },
    );
  }
}

async function waitForFile(path) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      return await readFile(path, "utf8");
    } catch {
      await wait(50);
    }
  }
  throw new Error(`Chrome did not create ${path}`);
}

async function evaluate(client, expression) {
  const response = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text);
  }
  return response.result.value;
}

async function waitForPath(client, pathname, selector) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const ready = await evaluate(
      client,
      `location.pathname === ${JSON.stringify(pathname)} &&
       document.querySelector(${JSON.stringify(selector)}) !== null`,
    );
    if (ready) return;
    await wait(50);
  }
  throw new Error(`Page did not load: ${pathname}`);
}

async function pressTab(client) {
  const key = {
    code: "Tab",
    key: "Tab",
    nativeVirtualKeyCode: 9,
    windowsVirtualKeyCode: 9,
  };
  await client.send("Input.dispatchKeyEvent", { ...key, type: "rawKeyDown" });
  await client.send("Input.dispatchKeyEvent", { ...key, type: "keyUp" });
}

async function zoomIn(client) {
  const key = {
    code: "Equal",
    key: "+",
    modifiers: 2,
    nativeVirtualKeyCode: 187,
    windowsVirtualKeyCode: 187,
  };
  await client.send("Input.dispatchKeyEvent", { ...key, type: "rawKeyDown" });
  await client.send("Input.dispatchKeyEvent", { ...key, type: "keyUp" });
}

async function metrics(client) {
  return evaluate(
    client,
    `({
      clientWidth: document.documentElement.clientWidth,
      devicePixelRatio,
      innerWidth,
      pathname: location.pathname,
      scrollWidth: document.documentElement.scrollWidth,
      visualViewportScale: visualViewport.scale
    })`,
  );
}

async function assertFocusOrder(client, expectedFocus) {
  await evaluate(client, "document.activeElement?.blur()");
  const actualFocus = [];

  for (const expected of expectedFocus) {
    await pressTab(client);
    const active = await evaluate(
      client,
      `({
        focusVisible: document.activeElement.matches(":focus-visible"),
        focusWithinBoxShadow: (() => {
          const container = document.activeElement.closest("label");
          return container?.matches(":focus-within")
            ? getComputedStyle(container).boxShadow
            : "none";
        })(),
        id: document.activeElement.id || undefined,
        name: document.activeElement.getAttribute("name") || undefined,
        outlineStyle: getComputedStyle(document.activeElement).outlineStyle,
        outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
        tag: document.activeElement.tagName,
        text: document.activeElement.textContent?.replace(/\\s+/g, " ").trim() || undefined,
        type: document.activeElement.getAttribute("type") || undefined
      })`,
    );

    const descriptor = Object.fromEntries(
      Object.keys(expected).map((key) => [key, active[key]]),
    );
    assert.ok(
      hasVisibleFocusIndicator(active),
      `No visible focus indicator on ${JSON.stringify(descriptor)}`,
    );
    assert.deepEqual(descriptor, expected);
    actualFocus.push(descriptor);
  }

  return actualFocus;
}

async function click(client, selector) {
  const point = await elementCenterAfterScroll(
    (expression) => evaluate(client, expression),
    selector,
  );
  await client.send("Input.dispatchMouseEvent", {
    button: "left",
    clickCount: 1,
    type: "mousePressed",
    ...point,
  });
  await client.send("Input.dispatchMouseEvent", {
    button: "left",
    clickCount: 1,
    type: "mouseReleased",
    ...point,
  });
}

async function replaceText(client, selector, value) {
  await click(client, selector);
  const selectAll = {
    code: "KeyA",
    key: "a",
    modifiers: 2,
    nativeVirtualKeyCode: 65,
    windowsVirtualKeyCode: 65,
  };
  await client.send("Input.dispatchKeyEvent", {
    ...selectAll,
    type: "rawKeyDown",
  });
  await client.send("Input.dispatchKeyEvent", {
    ...selectAll,
    type: "keyUp",
  });
  await client.send("Input.insertText", { text: value });
}

async function browserRun(zoomSteps) {
  const profile = await mkdtemp(join(tmpdir(), "planner-browser-gate-"));
  const chrome = spawn(
    CHROME_PATH,
    [
      "--headless=new",
      "--disable-background-networking",
      "--disable-default-apps",
      "--no-first-run",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--window-size=1440,1000",
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true },
  );
  const run = { chrome, client: undefined, profile };
  runs.push(run);

  const launchError = new Promise((_, reject) => chrome.once("error", reject));
  const [port] = (
    await Promise.race([
      waitForFile(join(profile, "DevToolsActivePort")),
      launchError,
    ])
  )
    .trim()
    .split(/\r?\n/);
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`, {
    signal: AbortSignal.timeout(5_000),
  }).then((response) => response.json());
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error("Chrome did not expose a page target");

  run.client = await connectCdp(page.webSocketDebuggerUrl);
  await run.client.send("Page.enable");
  await run.client.send("Runtime.enable");
  await run.client.send("Page.navigate", { url: APP_URL.href });
  await waitForPath(run.client, "/entrar", "#email");
  for (let step = 0; step < zoomSteps; step += 1) {
    await zoomIn(run.client);
  }
  await wait(100);

  return run;
}

async function removeProfile(profile) {
  const resolvedProfile = resolve(profile);
  const resolvedTemp = `${resolve(tmpdir())}${sep}`;
  assert.ok(resolvedProfile.startsWith(resolvedTemp));
  assert.ok(basename(resolvedProfile).startsWith("planner-browser-gate-"));

  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await rm(resolvedProfile, { force: true, recursive: true });
      return;
    } catch (error) {
      if (error.code !== "EBUSY" || attempt === 19) throw error;
      await wait(100);
    }
  }
}

async function closeRun(run) {
  run.client?.close();
  run.client = undefined;
  if (run.chrome.exitCode === null) {
    const exited = new Promise((resolveExit) =>
      run.chrome.once("exit", resolveExit),
    );
    run.chrome.kill();
    await Promise.race([exited, wait(2_000)]);
  }
  await removeProfile(run.profile);
}

async function closeBrowserRuns() {
  const results = await Promise.allSettled(runs.map(closeRun));
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
}

async function runBrowserGate(identity) {
  const baseline = await browserRun(0);
  const zoomed = await browserRun(5);
  const loginFocus = await assertFocusOrder(zoomed.client, [
    { tag: "A", text: "Meu espaço" },
    { id: "email", tag: "INPUT" },
    { id: "password", tag: "INPUT" },
    { tag: "BUTTON", text: "Entrar" },
    { tag: "BUTTON", text: "Criar minha conta" },
    { tag: "BUTTON", text: "Continuar com Google" },
  ]);
  const zoom100 = await metrics(baseline.client);
  const loginMetrics = await metrics(zoomed.client);

  assert.equal(loginMetrics.visualViewportScale, 1);
  const pixelRatio =
    loginMetrics.devicePixelRatio / zoom100.devicePixelRatio;
  const viewportRatio = zoom100.innerWidth / loginMetrics.innerWidth;
  assert.ok(Math.abs(pixelRatio - 2) <= 0.05);
  assert.ok(Math.abs(viewportRatio - 2) <= 0.05);
  assert.equal(zoom100.clientWidth, zoom100.scrollWidth);
  assert.equal(loginMetrics.clientWidth, loginMetrics.scrollWidth);

  await replaceText(zoomed.client, "#email", identity.email);
  await replaceText(zoomed.client, "#password", identity.password);
  await click(
    zoomed.client,
    'form button[type="submit"]:not([data-auth-action])',
  );
  await waitForPath(zoomed.client, "/onboarding", "#displayName");

  const onboardingFocus = await assertFocusOrder(zoomed.client, [
    { tag: "A", text: "Meu espaço" },
    { id: "displayName", tag: "INPUT" },
    { id: "timezone", tag: "SELECT" },
    { name: "emailReminders", tag: "INPUT", type: "checkbox" },
    { name: "aiConsent", tag: "INPUT", type: "checkbox" },
    { tag: "BUTTON", text: "Preparar meu espaço" },
  ]);
  const onboardingMetrics = await metrics(zoomed.client);
  assert.equal(onboardingMetrics.devicePixelRatio, loginMetrics.devicePixelRatio);
  assert.equal(onboardingMetrics.clientWidth, onboardingMetrics.scrollWidth);

  await replaceText(zoomed.client, "#displayName", "E2E Browser Gate");
  await click(zoomed.client, 'button[type="submit"]');
  await waitForPath(zoomed.client, "/", "#quick-capture");

  const todayFocus = await assertFocusOrder(zoomed.client, [
    { tag: "A", text: "Pular para o conteúdo" },
    { tag: "A", text: "Hoje" },
    { tag: "A", text: "Agenda" },
    { tag: "A", text: "Tarefas" },
    { tag: "A", text: "Finanças" },
    { tag: "A", text: "Bem-estar" },
    { tag: "SUMMARY", text: "Mais" },
    { tag: "BUTTON", text: "Adicionar" },
    { id: "quick-capture", tag: "INPUT" },
  ]);
  const todayMetrics = await metrics(zoomed.client);
  assert.equal(todayMetrics.devicePixelRatio, loginMetrics.devicePixelRatio);
  assert.equal(todayMetrics.clientWidth, todayMetrics.scrollWidth);
  assert.equal(
    await evaluate(
      zoomed.client,
      'document.querySelector("h1")?.textContent',
    ),
    "Bom dia, E2E Browser Gate",
  );

  if (SCREENSHOT_PATH) {
    await baseline.client.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: 844,
      mobile: false,
      width: 390,
    });
    await baseline.client.send("Page.reload");
    await waitForPath(baseline.client, "/entrar", "#email");
    const screenshot = await baseline.client.send("Page.captureScreenshot", {
      captureBeyondViewport: false,
      format: "png",
      fromSurface: true,
    });
    await writeFile(SCREENSHOT_PATH, screenshot.data, "base64");
  }

  console.log(
    JSON.stringify(
      {
        routes: {
          entrar: { focusOrder: loginFocus, metrics: loginMetrics },
          onboarding: {
            focusOrder: onboardingFocus,
            metrics: onboardingMetrics,
          },
          today: { focusOrder: todayFocus, metrics: todayMetrics },
        },
        zoom100,
      },
      null,
      2,
    ),
  );
}

assert.equal(
  process.platform,
  "win32",
  "The browser gate currently supports Windows only",
);
assertLocalUrl(APP_URL, "APP_URL");
const supabase = await loadLocalSupabase();
const identity = {
  email: `browser-gate-${randomUUID()}@example.com`,
  id: undefined,
  password: `Gate-${randomUUID()}-Aa1!`,
};

try {
  await createLocalIdentity(supabase, identity);
  await withTimeoutCleanup(() => runBrowserGate(identity), {
    cleanup: closeBrowserRuns,
    timeoutMs: 60_000,
  });
} finally {
  await cleanupLocalIdentity(supabase, identity);
}
