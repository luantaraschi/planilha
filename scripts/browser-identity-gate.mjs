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
  pressArrow,
  ResourceRegistry,
  withTimeoutCleanup,
} from "./browser-gate-lib.mjs";
import { runResponsiveGate } from "./browser-responsive-gate.mjs";

const APP_URL = new URL(
  process.env.APP_URL ?? "http://127.0.0.1:3000/entrar",
);
const ROOT_URL = new URL("/", APP_URL);
const SCREENSHOT_PATH = process.env.SCREENSHOT_PATH;
const CHROME_PATH =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const execFileAsync = promisify(execFile);
const runs = new ResourceRegistry(closeRun);
const INVALID_AUTH_MESSAGE =
  "Não foi possível entrar. Confira seu e-mail e sua senha.";
const ONBOARDING_EXPECTED = {
  aiConsent: true,
  auditAction: "identity.onboarding.completed",
  auditCount: 1,
  displayName: "E2E Browser Gate",
  emailReminders: false,
  onboardingCompleted: true,
  timezone: "America/Sao_Paulo",
};

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

async function localRequest(supabase, pathname, { method = "GET" } = {}) {
  const response = await fetch(new URL(`/auth/v1/admin${pathname}`, supabase.apiUrl), {
    headers: {
      apikey: supabase.serviceRoleKey,
      authorization: `Bearer ${supabase.serviceRoleKey}`,
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

function assertLocalUserId(userId) {
  assert.match(
    userId,
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  );
}

async function runLocalSql(query) {
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
  return stdout.trim();
}

async function verifyLocalIdentityRemoved(userId) {
  assertLocalUserId(userId);
  const remainingRows = await runLocalSql(`select
    (select count(*) from auth.users where id = '${userId}') +
    (select count(*) from public.profiles where user_id = '${userId}') +
    (select count(*) from public.preferences where user_id = '${userId}') +
    (select count(*) from public.audit_events where user_id = '${userId}');`);
  assert.equal(remainingRows, "0", "ephemeral identity data still exists");
}

async function listLocalUsers(supabase) {
  const data = await localRequest(supabase, "/users?page=1&per_page=1000");
  return data.users;
}

async function rememberLocalIdentity(supabase, identity) {
  const user = (await listLocalUsers(supabase)).find(
    (candidate) => candidate.email === identity.email,
  );
  assert.ok(user, "UI sign-up did not create the local auth user");
  assert.equal(typeof user.id, "string");
  identity.id = user.id;
}

async function inspectLocalIdentity(identity) {
  assertLocalUserId(identity.id);
  const data = JSON.parse(
    await runLocalSql(`select json_build_object(
      'displayName', profile.display_name,
      'onboardingCompleted', profile.onboarding_completed,
      'timezone', preference.timezone,
      'emailReminders', preference.email_reminders,
      'aiConsent', preference.ai_processing_consent,
      'auditCount', (
        select count(*) from public.audit_events
        where user_id = profile.user_id
      ),
      'auditAction', (
        select min(action) from public.audit_events
        where user_id = profile.user_id
      )
    )::text
    from public.profiles as profile
    join public.preferences as preference using (user_id)
    where profile.user_id = '${identity.id}';`),
  );
  assert.deepEqual(data, ONBOARDING_EXPECTED);
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

async function assertFocusOrder(
  client,
  expectedFocus,
  { advance = pressTab, reset = true, visible = true } = {},
) {
  if (reset) {
    await evaluate(
      client,
      `(() => {
        document.activeElement?.blur();
        window.__browserGateFocusBaseline = new WeakMap();
        const focusables = document.querySelectorAll(
          'a[href], button, input, select, summary, [tabindex]'
        );
        for (const element of focusables) {
          const container = element.closest("label");
          if (!container) continue;
          const style = getComputedStyle(container);
          window.__browserGateFocusBaseline.set(element, {
            borderColor: style.borderColor,
            boxShadow: style.boxShadow
          });
        }
      })()`,
    );
  }
  const actualFocus = [];

  for (const expected of expectedFocus) {
    await advance(client);
    const active = await evaluate(
      client,
      `(() => {
        const active = document.activeElement;
        const container = active.closest("label");
        const containerStyle = container
          ? getComputedStyle(container)
          : undefined;
        const baseline = window.__browserGateFocusBaseline.get(active);
        return {
          focusVisible: active.matches(":focus-visible"),
          focusWithin: container?.matches(":focus-within") ?? false,
          focusWithinBorderColorAfter: containerStyle?.borderColor,
          focusWithinBorderColorBefore: baseline?.borderColor,
          focusWithinBoxShadowAfter: containerStyle?.boxShadow,
          focusWithinBoxShadowBefore: baseline?.boxShadow,
          ariaLabel: active.getAttribute("aria-label") || undefined,
          checked: "checked" in active ? active.checked : undefined,
          id: active.id || undefined,
          name: active.getAttribute("name") || undefined,
          outlineStyle: getComputedStyle(active).outlineStyle,
          outlineWidth: getComputedStyle(active).outlineWidth,
          tag: active.tagName,
          text: active.innerText?.replace(/\\s+/g, " ").trim() || undefined,
          type: active.getAttribute("type") || undefined,
          value: active.getAttribute("value") || undefined
        };
      })()`,
    );

    const descriptor = Object.fromEntries(
      Object.keys(expected).map((key) => [key, active[key]]),
    );
    assert.equal(
      hasVisibleFocusIndicator(active),
      visible,
      `Unexpected focus indicator state on ${JSON.stringify(descriptor)}`,
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

async function selectNextOption(client, selector, expectedValue) {
  await click(client, selector);
  await pressArrow(client, "down");
  await pressTab(client);
  assert.equal(
    await evaluate(
      client,
      `document.querySelector(${JSON.stringify(selector)}).value`,
    ),
    expectedValue,
  );
}

async function setCheckbox(client, selector, checked) {
  const current = await evaluate(
    client,
    `document.querySelector(${JSON.stringify(selector)}).checked`,
  );
  if (current !== checked) await click(client, selector);
  assert.equal(
    await evaluate(
      client,
      `document.querySelector(${JSON.stringify(selector)}).checked`,
    ),
    checked,
  );
}

async function browserRun(zoomSteps) {
  const profile = await mkdtemp(join(tmpdir(), "planner-browser-gate-"));
  const run = await runs.register({
    chrome: undefined,
    client: undefined,
    profile,
  });
  run.chrome = spawn(
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

  const launchError = new Promise((_, reject) =>
    run.chrome.once("error", reject),
  );
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
  await run.client.send("Page.navigate", { url: ROOT_URL.href });
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
  if (run.chrome?.exitCode === null) {
    const exited = new Promise((resolveExit) =>
      run.chrome.once("exit", resolveExit),
    );
    run.chrome.kill();
    await Promise.race([exited, wait(2_000)]);
  }
  await removeProfile(run.profile);
}

async function closeBrowserRuns() {
  await runs.cleanup();
}

async function assertCompleteTodayFocus(client, expectedDevicePixelRatio) {
  const navigationFocus = await assertFocusOrder(client, [
    { tag: "A", text: "Pular para o conteúdo" },
    { ariaLabel: "Ir para o início", tag: "A" },
    { tag: "A", text: "Hoje" },
    { tag: "A", text: "Agenda" },
    { tag: "A", text: "Tarefas" },
    { tag: "A", text: "Finanças" },
    { tag: "A", text: "Bem-estar" },
    { tag: "A", text: "Metas" },
    { tag: "A", text: "Notas" },
    { tag: "A", text: "Assistente" },
    { tag: "A", text: "Configurações" },
    { tag: "BUTTON", text: "Sair" },
  ]);
  const contentBeforeMoodFocus = await assertFocusOrder(
    client,
    [
      { tag: "BUTTON", text: "Adicionar" },
      { id: "quick-capture", tag: "INPUT" },
      {
        checked: false,
        name: "mood",
        tag: "INPUT",
        type: "radio",
        value: "terrible",
      },
    ],
    { reset: false },
  );
  const arrowRight = (activeClient) => pressArrow(activeClient, "right");
  const moodArrowFocus = await assertFocusOrder(
    client,
    [
      {
        checked: true,
        name: "mood",
        tag: "INPUT",
        type: "radio",
        value: "bad",
      },
      {
        checked: true,
        name: "mood",
        tag: "INPUT",
        type: "radio",
        value: "neutral",
      },
      {
        checked: true,
        name: "mood",
        tag: "INPUT",
        type: "radio",
        value: "good",
      },
      {
        checked: true,
        name: "mood",
        tag: "INPUT",
        type: "radio",
        value: "great",
      },
    ],
    { advance: arrowRight, reset: false },
  );
  await assertFocusOrder(
    client,
    [
      {
        checked: true,
        name: "mood",
        tag: "INPUT",
        type: "radio",
        value: "terrible",
      },
    ],
    { advance: arrowRight, reset: false },
  );
  const priorityFocus = await assertFocusOrder(
    client,
    [
      { id: "priority-documents", tag: "INPUT", type: "checkbox" },
      { id: "priority-budget", tag: "INPUT", type: "checkbox" },
      { id: "priority-medicine", tag: "INPUT", type: "checkbox" },
    ],
    { reset: false },
  );
  await assertFocusOrder(
    client,
    [{ tag: "BODY" }],
    { reset: false, visible: false },
  );
  await assertFocusOrder(
    client,
    [{ tag: "A", text: "Pular para o conteúdo" }],
    { reset: false },
  );

  const todayMetrics = await metrics(client);
  assert.equal(
    todayMetrics.devicePixelRatio,
    expectedDevicePixelRatio,
  );
  assert.equal(todayMetrics.visualViewportScale, 1);
  assert.equal(todayMetrics.clientWidth, todayMetrics.scrollWidth);

  return {
    focusOrder: [
      ...navigationFocus,
      ...contentBeforeMoodFocus,
      ...moodArrowFocus,
      ...priorityFocus,
    ],
    metrics: todayMetrics,
  };
}

async function runBrowserGate(supabase, identity) {
  const baseline = await browserRun(0);
  const zoomed = await browserRun(5);
  assert.equal(ROOT_URL.pathname, "/");
  assert.equal(
    await evaluate(zoomed.client, "location.pathname"),
    "/entrar",
  );
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
  await waitForPath(zoomed.client, "/entrar", '[role="alert"]');
  assert.equal(
    await evaluate(
      zoomed.client,
      'document.querySelector(\'[role="alert"]\').textContent.trim()',
    ),
    INVALID_AUTH_MESSAGE,
  );

  await replaceText(zoomed.client, "#email", identity.email);
  await replaceText(zoomed.client, "#password", identity.password);
  await click(zoomed.client, 'button[data-auth-action="signup"]');
  await waitForPath(zoomed.client, "/onboarding", "#displayName");
  await rememberLocalIdentity(supabase, identity);

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

  await replaceText(
    zoomed.client,
    "#displayName",
    ONBOARDING_EXPECTED.displayName,
  );
  await selectNextOption(
    zoomed.client,
    "#timezone",
    ONBOARDING_EXPECTED.timezone,
  );
  await setCheckbox(
    zoomed.client,
    'input[name="emailReminders"]',
    ONBOARDING_EXPECTED.emailReminders,
  );
  await setCheckbox(
    zoomed.client,
    'input[name="aiConsent"]',
    ONBOARDING_EXPECTED.aiConsent,
  );
  await click(zoomed.client, 'button[type="submit"]');
  await waitForPath(zoomed.client, "/", "#quick-capture");
  await inspectLocalIdentity(identity);

  assert.equal(
    await evaluate(
      zoomed.client,
      'document.querySelector("h1")?.textContent',
    ),
    `Bom dia, ${ONBOARDING_EXPECTED.displayName}`,
  );

  await click(zoomed.client, 'nav > form button[type="submit"]');
  await waitForPath(zoomed.client, "/entrar", "#email");

  await replaceText(zoomed.client, "#email", identity.email);
  await replaceText(zoomed.client, "#password", identity.password);
  await click(
    zoomed.client,
    'form button[type="submit"]:not([data-auth-action])',
  );
  await waitForPath(zoomed.client, "/", "#quick-capture");
  assert.equal(
    await evaluate(
      zoomed.client,
      'document.querySelector("h1")?.textContent',
    ),
    `Bom dia, ${ONBOARDING_EXPECTED.displayName}`,
  );
  const today = await assertCompleteTodayFocus(
    zoomed.client,
    loginMetrics.devicePixelRatio,
  );
  await replaceText(baseline.client, "#email", identity.email);
  await replaceText(baseline.client, "#password", identity.password);
  await click(
    baseline.client,
    'form button[type="submit"]:not([data-auth-action])',
  );
  await waitForPath(baseline.client, "/", "#quick-capture");
  const responsive = await runResponsiveGate(baseline.client);

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
        invalidCredentials: "safe inline alert",
        rootRedirect: "/ → /entrar",
        routes: {
          entrar: { focusOrder: loginFocus, metrics: loginMetrics },
          onboarding: {
            focusOrder: onboardingFocus,
            metrics: onboardingMetrics,
          },
          today,
        },
        responsive,
        zoom100,
      },
      null,
      2,
    ),
  );
}

async function runTodayContinuation(credentials) {
  const zoomed = await browserRun(5);
  const baseline = await browserRun(0);
  const loginMetrics = await metrics(zoomed.client);
  await replaceText(zoomed.client, "#email", credentials.email);
  await replaceText(zoomed.client, "#password", credentials.password);
  await click(
    zoomed.client,
    'form button[type="submit"]:not([data-auth-action])',
  );
  await waitForPath(zoomed.client, "/", "#quick-capture");
  const today = await assertCompleteTodayFocus(
    zoomed.client,
    loginMetrics.devicePixelRatio,
  );
  await replaceText(baseline.client, "#email", credentials.email);
  await replaceText(baseline.client, "#password", credentials.password);
  await click(
    baseline.client,
    'form button[type="submit"]:not([data-auth-action])',
  );
  await waitForPath(baseline.client, "/", "#quick-capture");
  const responsive = await runResponsiveGate(baseline.client);

  console.log(
    JSON.stringify(
      { continuation: "today", responsive, routes: { today } },
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
const mode = process.env.BROWSER_GATE_MODE ?? "full";

if (mode === "continue-today") {
  const credentials = {
    email: process.env.BROWSER_GATE_EMAIL,
    password: process.env.BROWSER_GATE_PASSWORD,
  };
  assert.ok(credentials.email, "BROWSER_GATE_EMAIL is required");
  assert.ok(credentials.password, "BROWSER_GATE_PASSWORD is required");
  await withTimeoutCleanup(() => runTodayContinuation(credentials), {
    cleanup: closeBrowserRuns,
    timeoutMs: 60_000,
  });
} else {
  assert.equal(mode, "full", "Unsupported BROWSER_GATE_MODE");
  const supabase = await loadLocalSupabase();
  const identity = {
    email: `browser-gate-${randomUUID()}@example.com`,
    id: undefined,
    password: `Gate-${randomUUID()}-Aa1!`,
  };

  try {
    await withTimeoutCleanup(() => runBrowserGate(supabase, identity), {
      cleanup: closeBrowserRuns,
      timeoutMs: 60_000,
    });
  } finally {
    await cleanupLocalIdentity(supabase, identity);
  }
}
