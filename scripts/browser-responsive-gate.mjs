import {
  assertResponsiveAudit,
  elementCenterAfterScroll,
  hasVisibleFocusIndicator,
  RESPONSIVE_VIEWPORTS,
} from "./browser-gate-lib.mjs";

const wait = (milliseconds) =>
  new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));

async function evaluate(client, expression, awaitPromise = false) {
  const response = await client.send("Runtime.evaluate", {
    awaitPromise,
    expression,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text);
  }
  return response.result.value;
}

async function waitForToday(client, previousDocumentMarker) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (
      await evaluate(
        client,
        `(() => {
          const capture = document.querySelector("#quick-capture");
          const rect = capture?.getBoundingClientRect();
          return document.readyState === "complete" &&
            document.documentElement.dataset.browserGateDocument !==
              ${JSON.stringify(previousDocumentMarker)} &&
            location.pathname === "/" &&
            capture?.isConnected === true &&
            rect.width > 0 && rect.height > 0;
        })()`,
      )
    ) {
      return;
    }
    await wait(50);
  }
  throw new Error("Responsive gate could not load Today");
}

async function assertRailAccessibleNames(client) {
  const expectedDestinations = [
    "Hoje",
    "Agenda",
    "Tarefas",
    "Finanças",
    "Bem-estar",
    "Metas",
    "Notas",
    "Assistente",
    "Configurações",
  ];
  const visibleLabels = await evaluate(
    client,
    `([...document.querySelectorAll("[data-compact-label]")])
      .filter((label) => getComputedStyle(label).display !== "none")
      .map((label) => ({
        accessible: label.closest("a")?.getAttribute("aria-label"),
        visible: label.textContent?.trim()
      }))`,
  );
  const expectedLabels = expectedDestinations.map((label) => ({
    accessible: label,
    visible: label,
  }));
  if (JSON.stringify(visibleLabels) !== JSON.stringify(expectedLabels)) {
    throw new Error(
      `tablet rail visible labels do not match accessible names: ${JSON.stringify(visibleLabels)}`,
    );
  }

  await client.send("Accessibility.enable");
  const { nodes } = await client.send("Accessibility.getFullAXTree");
  const names = nodes
    .filter((node) => ["button", "link"].includes(node.role?.value))
    .map((node) => node.name?.value)
    .filter(Boolean);
  const expected = [...expectedDestinations, "Sair"];
  const missing = expected.filter((name) => !names.includes(name));
  if (missing.length > 0) {
    throw new Error(`tablet rail has unnamed destinations: ${missing.join(", ")}`);
  }
}

async function touchClick(client, selector) {
  const point = await elementCenterAfterScroll(
    (expression) => evaluate(client, expression),
    selector,
  );
  await evaluate(
    client,
    `(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      const point = ${JSON.stringify(point)};
      const top = document.elementFromPoint(point.x, point.y);
      if (!element || !top || !(top === element || element.contains(top))) {
        throw new Error("Touch target is covered");
      }
      for (const type of ["pointerdown", "pointerup"]) {
        element.dispatchEvent(new PointerEvent(type, {
          bubbles: true,
          clientX: point.x,
          clientY: point.y,
          isPrimary: true,
          pointerId: 1,
          pointerType: "touch"
        }));
      }
      element.click();
    })()`,
  );
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

async function assertKeyboardEntry(client) {
  await evaluate(
    client,
    `document.body.tabIndex = -1;
     document.body.focus();
     document.body.removeAttribute("tabindex");`,
  );
  await pressTab(client);
  const focus = await evaluate(
    client,
    `(() => {
      const active = document.activeElement;
      const style = getComputedStyle(active);
      return {
        focusVisible: active.matches(":focus-visible"),
        focusWithin: false,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        text: active.textContent?.replace(/\\s+/g, " ").trim()
      };
    })()`,
  );
  if (
    focus.text !== "Pular para o conteúdo" ||
    !hasVisibleFocusIndicator(focus)
  ) {
    throw new Error(
      `keyboard entry does not expose the skip link: ${JSON.stringify(focus)}`,
    );
  }
}

async function collectAudit(client) {
  return evaluate(
    client,
    `(async () => {
      const visible = (element) => {
        if (
          element.closest("details:not([open])") &&
          !element.matches("summary")
        ) return false;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" &&
          rect.width > 0 && rect.height > 0;
      };
      const actions = [...document.querySelectorAll(
        'a[href], button:not([disabled]), summary, input[type="submit"], [role="button"]'
      )].filter(visible);
      const coveredActions = [];
      for (const action of actions) {
        action.scrollIntoView({ behavior: "instant", block: "center" });
        await new Promise(requestAnimationFrame);
        const rect = action.getBoundingClientRect();
        const x = Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
        const y = Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
        const stack = document.elementsFromPoint(x, y);
        if (!stack.some((element) => element === action || action.contains(element))) {
          coveredActions.push(
            action.getAttribute("aria-label") ||
            action.textContent?.replace(/\\s+/g, " ").trim() ||
            action.tagName
          );
        }
      }
      const dialogs = [...document.querySelectorAll('dialog, [role="dialog"]')]
        .filter(visible)
        .map((dialog) => {
          const labelledBy = dialog.getAttribute("aria-labelledby");
          const label =
            dialog.getAttribute("aria-label") ||
            (labelledBy ? document.getElementById(labelledBy)?.textContent?.trim() : "");
          const rect = dialog.getBoundingClientRect();
          return {
            accessible: Boolean(label) && rect.top >= 0 && rect.left >= 0 &&
              rect.right <= innerWidth && rect.bottom <= innerHeight,
            label: label || ""
          };
        });
      return {
        coveredActions,
        dialogs,
        viewport: {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        }
      };
    })()`,
    true,
  );
}

async function assertAssistantReachable(client, mobile) {
  if (mobile) {
    await touchClick(client, "details > summary");
    const reachable = await evaluate(
      client,
      `(() => {
        const links = [...document.querySelectorAll('a[href="/financas#assistente"]')];
        return links.some((link) => {
          const rect = link.getBoundingClientRect();
          return getComputedStyle(link).display !== "none" &&
            rect.width > 0 && rect.height > 0 &&
            rect.top >= 0 && rect.bottom <= innerHeight;
        });
      })()`,
    );
    if (!reachable) throw new Error("assistant is unreachable from mobile More");
    await touchClick(client, "details > summary");
    return;
  }

  const reachable = await evaluate(
    client,
    `(() => {
      const link = document.querySelector(
        'a[data-mobile-secondary="true"][href="/financas#assistente"]'
      );
      const rect = link?.getBoundingClientRect();
      return Boolean(rect && getComputedStyle(link).display !== "none" &&
        rect.width > 0 && rect.height > 0);
    })()`,
  );
  if (!reachable) throw new Error("assistant is unreachable from the rail/sidebar");
}

export async function runResponsiveGate(client) {
  const captures = [];

  for (const viewport of RESPONSIVE_VIEWPORTS) {
    const mobile = viewport.width < 600;
    await client.send("Emulation.clearDeviceMetricsOverride");
    await client.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 1,
      height: viewport.height,
      mobile,
      width: viewport.width,
    });
    await client.send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 1,
    });
    const previousDocumentMarker = `before-${viewport.name}-${Date.now()}`;
    await evaluate(
      client,
      `document.documentElement.dataset.browserGateDocument =
        ${JSON.stringify(previousDocumentMarker)}`,
    );
    await client.send("Page.reload");
    await waitForToday(client, previousDocumentMarker);

    if (viewport.width === 800) await assertRailAccessibleNames(client);
    await assertAssistantReachable(client, mobile);
    await assertKeyboardEntry(client);

    const audit = await collectAudit(client);
    assertResponsiveAudit(audit);
    await evaluate(client, "scrollTo(0, 0)");
    const screenshot = await client.send("Page.captureScreenshot", {
      captureBeyondViewport: false,
      format: "png",
      fromSurface: true,
    });
    captures.push({
      ...viewport,
      screenshotBytes: Math.floor((screenshot.data.length * 3) / 4),
    });
  }

  await client.send("Emulation.clearDeviceMetricsOverride");
  await client.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  return captures;
}
