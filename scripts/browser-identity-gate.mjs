import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const APP_URL = process.env.APP_URL ?? "http://127.0.0.1:3000/entrar";
const SCREENSHOT_PATH = process.env.SCREENSHOT_PATH;
const CHROME_PATH =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

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

async function connect(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let nextId = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  return {
    close: () => socket.close(),
    send(method, params = {}) {
      const id = ++nextId;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
    },
  };
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

async function waitForPage(client) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ready = await evaluate(
      client,
      `document.readyState === "complete" && location.pathname === "/entrar"`,
    );
    if (ready) return;
    await wait(50);
  }
  throw new Error(`Page did not load: ${APP_URL}`);
}

async function pressTab(client) {
  const key = {
    code: "Tab",
    key: "Tab",
    nativeVirtualKeyCode: 9,
    windowsVirtualKeyCode: 9,
  };
  await client.send("Input.dispatchKeyEvent", {
    ...key,
    type: "rawKeyDown",
  });
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
  await client.send("Input.dispatchKeyEvent", {
    ...key,
    type: "rawKeyDown",
  });
  await client.send("Input.dispatchKeyEvent", { ...key, type: "keyUp" });
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

  let client;
  try {
    const launchError = new Promise((_, reject) =>
      chrome.once("error", reject),
    );
    const [port] = (
      await Promise.race([
        waitForFile(join(profile, "DevToolsActivePort")),
        launchError,
      ])
    ).trim().split(/\r?\n/);
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(
      (response) => response.json(),
    );
    const page = targets.find((target) => target.type === "page");
    if (!page) throw new Error("Chrome did not expose a page target");

    client = await connect(page.webSocketDebuggerUrl);
    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("Page.navigate", { url: APP_URL });
    await waitForPage(client);
    for (let step = 0; step < zoomSteps; step += 1) {
      await zoomIn(client);
    }
    await wait(100);

    const metrics = await evaluate(
      client,
      `({
        clientWidth: document.documentElement.clientWidth,
        devicePixelRatio,
        innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        visualViewportScale: visualViewport.scale
      })`,
    );

    return { client, metrics, profile, chrome };
  } catch (error) {
    chrome.kill();
    await removeProfile(profile);
    throw error;
  }
}

async function removeProfile(profile) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await rm(profile, { force: true, recursive: true });
      return;
    } catch (error) {
      if (error.code !== "EBUSY" || attempt === 19) throw error;
      await wait(100);
    }
  }
}

async function closeRun(run) {
  run.client.close();
  if (run.chrome.exitCode === null) {
    const exited = new Promise((resolve) => run.chrome.once("exit", resolve));
    run.chrome.kill();
    await Promise.race([exited, wait(2_000)]);
  }
  await removeProfile(run.profile);
}

const runs = [];
try {
  const baseline = await browserRun(0);
  runs.push(baseline);
  const zoomed = await browserRun(5);
  runs.push(zoomed);
  const expectedFocus = [
    { tag: "A", text: "Meu espaço" },
    { id: "email", tag: "INPUT" },
    { id: "password", tag: "INPUT" },
    { tag: "BUTTON", text: "Entrar" },
    { tag: "BUTTON", text: "Criar minha conta" },
    { tag: "BUTTON", text: "Continuar com Google" },
  ];
  const actualFocus = [];

  for (const expected of expectedFocus) {
    await pressTab(zoomed.client);
    const active = await evaluate(
      zoomed.client,
      `({
        id: document.activeElement.id || undefined,
        focusVisible: document.activeElement.matches(":focus-visible"),
        outlineStyle: getComputedStyle(document.activeElement).outlineStyle,
        outlineWidth: getComputedStyle(document.activeElement).outlineWidth,
        tag: document.activeElement.tagName,
        text: document.activeElement.textContent?.trim() || undefined
      })`,
    );
    assert.equal(active.focusVisible, true);
    assert.notEqual(active.outlineStyle, "none");
    assert.ok(Number.parseFloat(active.outlineWidth) > 0);
    const descriptor = { tag: active.tag };
    if (active.id) descriptor.id = active.id;
    if (active.text) descriptor.text = active.text;
    actualFocus.push(descriptor);
    assert.deepEqual(actualFocus.at(-1), expected);
  }

  assert.equal(zoomed.metrics.visualViewportScale, 1);
  const pixelRatio =
    zoomed.metrics.devicePixelRatio / baseline.metrics.devicePixelRatio;
  const viewportRatio =
    baseline.metrics.innerWidth / zoomed.metrics.innerWidth;
  assert.ok(Math.abs(pixelRatio - 2) <= 0.05);
  assert.ok(Math.abs(viewportRatio - 2) <= 0.05);
  assert.equal(baseline.metrics.clientWidth, baseline.metrics.scrollWidth);
  assert.equal(zoomed.metrics.clientWidth, zoomed.metrics.scrollWidth);

  if (SCREENSHOT_PATH) {
    await baseline.client.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: 844,
      mobile: false,
      width: 390,
    });
    await baseline.client.send("Page.reload");
    await waitForPage(baseline.client);
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
        focusOrder: actualFocus,
        zoom100: baseline.metrics,
        zoom200: zoomed.metrics,
      },
      null,
      2,
    ),
  );
} finally {
  await Promise.all(runs.map(closeRun));
}
