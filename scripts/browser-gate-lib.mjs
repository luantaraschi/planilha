export class CdpClient {
  #commandTimeoutMs;
  #nextId = 0;
  #pending = new Map();
  #socket;

  constructor(socket, { commandTimeoutMs = 5_000 } = {}) {
    this.#socket = socket;
    this.#commandTimeoutMs = commandTimeoutMs;
    socket.addEventListener("message", (event) => this.#receive(event.data));
    socket.addEventListener("close", () =>
      this.#rejectPending(new Error("CDP socket closed")),
    );
    socket.addEventListener("error", () =>
      this.#rejectPending(new Error("CDP socket error")),
    );
  }

  close() {
    this.#rejectPending(new Error("CDP socket closed"));
    this.#socket.close();
  }

  send(method, params = {}) {
    const id = ++this.#nextId;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, this.#commandTimeoutMs);

      this.#pending.set(id, { reject, resolve, timer });
      this.#socket.send(JSON.stringify({ id, method, params }));
    });
  }

  #receive(rawMessage) {
    const message = JSON.parse(rawMessage);
    const request = this.#pending.get(message.id);

    if (!request) return;
    clearTimeout(request.timer);
    this.#pending.delete(message.id);

    if (message.error) {
      request.reject(new Error(message.error.message));
    } else {
      request.resolve(message.result);
    }
  }

  #rejectPending(error) {
    for (const request of this.#pending.values()) {
      clearTimeout(request.timer);
      request.reject(error);
    }
    this.#pending.clear();
  }
}

export class ResourceRegistry {
  #closed = false;
  #dispose;
  #resources = new Set();

  constructor(dispose) {
    this.#dispose = dispose;
  }

  async register(resource) {
    if (this.#closed) {
      await this.#dispose(resource);
      throw new Error("Resource registry is closed");
    }

    this.#resources.add(resource);
    return resource;
  }

  async cleanup() {
    this.#closed = true;
    const resources = [...this.#resources];
    this.#resources.clear();
    const results = await Promise.allSettled(
      resources.map((resource) => this.#dispose(resource)),
    );
    const failure = results.find((result) => result.status === "rejected");
    if (failure) throw failure.reason;
  }
}

export async function elementCenterAfterScroll(
  evaluate,
  selector,
  settle = () => new Promise((resolve) => setTimeout(resolve, 50)),
) {
  const serializedSelector = JSON.stringify(selector);
  await evaluate(`(() => {
    const element = document.querySelector(${serializedSelector});
    if (!element) throw new Error("Missing element");
    element.scrollIntoView({ behavior: "instant", block: "center" });
  })()`);
  await settle();

  return evaluate(`(() => {
    const element = document.querySelector(${serializedSelector});
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  })()`);
}

export async function pressEnter(client) {
  const key = {
    code: "Enter",
    key: "Enter",
    nativeVirtualKeyCode: 13,
    windowsVirtualKeyCode: 13,
  };
  await client.send("Input.dispatchKeyEvent", {
    ...key,
    text: "\r",
    type: "keyDown",
    unmodifiedText: "\r",
  });
  await client.send("Input.dispatchKeyEvent", { ...key, type: "keyUp" });
}

export async function pressArrow(client, direction) {
  const keys = {
    left: { code: "ArrowLeft", keyCode: 37 },
    right: { code: "ArrowRight", keyCode: 39 },
  };
  const arrow = keys[direction];
  if (!arrow) throw new Error(`Unsupported arrow direction: ${direction}`);
  const key = {
    code: arrow.code,
    key: arrow.code,
    nativeVirtualKeyCode: arrow.keyCode,
    windowsVirtualKeyCode: arrow.keyCode,
  };
  await client.send("Input.dispatchKeyEvent", {
    ...key,
    type: "rawKeyDown",
  });
  await client.send("Input.dispatchKeyEvent", { ...key, type: "keyUp" });
}

export function hasVisibleFocusIndicator({
  focusVisible,
  focusWithin,
  focusWithinBorderColorAfter,
  focusWithinBorderColorBefore,
  focusWithinBoxShadowAfter,
  focusWithinBoxShadowBefore,
  outlineStyle,
  outlineWidth,
}) {
  const hasOutline =
    outlineStyle !== "none" && Number.parseFloat(outlineWidth) > 0;
  const hasFocusWithinChange =
    focusWithin &&
    ((focusWithinBorderColorBefore !== undefined &&
      focusWithinBorderColorAfter !== undefined &&
      focusWithinBorderColorBefore !== focusWithinBorderColorAfter) ||
      (focusWithinBoxShadowBefore !== undefined &&
        focusWithinBoxShadowAfter !== undefined &&
        focusWithinBoxShadowBefore !== focusWithinBoxShadowAfter));
  return focusVisible && Boolean(hasOutline || hasFocusWithinChange);
}

export async function connectCdp(
  url,
  {
    commandTimeoutMs = 5_000,
    connectTimeoutMs = 5_000,
    WebSocketImpl = globalThis.WebSocket,
  } = {},
) {
  if (!WebSocketImpl) {
    throw new Error("The browser gate requires Node.js 22 or newer");
  }

  const socket = new WebSocketImpl(url);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error("CDP socket connection timed out"));
    }, connectTimeoutMs);

    socket.addEventListener(
      "open",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
    socket.addEventListener(
      "error",
      () => {
        clearTimeout(timer);
        reject(new Error("CDP socket connection failed"));
      },
      { once: true },
    );
  });

  return new CdpClient(socket, { commandTimeoutMs });
}

export async function withTimeoutCleanup(
  task,
  { cleanup, timeoutMs = 60_000 },
) {
  let timer;

  try {
    return await Promise.race([
      task(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Browser gate execution timed out")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
    await cleanup();
  }
}
