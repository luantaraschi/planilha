import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";
import {
  CdpClient,
  elementCenterAfterScroll,
  hasVisibleFocusIndicator,
  pressArrow,
  pressEnter,
  ResourceRegistry,
  withTimeoutCleanup,
} from "./browser-gate-lib.mjs";

class FakeSocket extends EventTarget {
  sent = [];

  close() {
    this.dispatchEvent(new Event("close"));
  }

  send(message) {
    this.sent.push(JSON.parse(message));
  }
}

describe("CdpClient", () => {
  it("times out a command that never receives a response", async () => {
    const client = new CdpClient(new FakeSocket(), {
      commandTimeoutMs: 10,
    });

    await assert.rejects(
      client.send("Runtime.evaluate"),
      /Runtime\.evaluate timed out/,
    );
  });

  it("rejects pending commands when the socket closes", async () => {
    const socket = new FakeSocket();
    const client = new CdpClient(socket, { commandTimeoutMs: 1_000 });
    const pending = client.send("Page.navigate");

    socket.dispatchEvent(new Event("close"));

    await assert.rejects(pending, /CDP socket closed/);
  });

  it("rejects pending commands when the socket errors", async () => {
    const socket = new FakeSocket();
    const client = new CdpClient(socket, { commandTimeoutMs: 1_000 });
    const pending = client.send("Page.navigate");

    socket.dispatchEvent(new Event("error"));

    await assert.rejects(pending, /CDP socket error/);
  });
});

describe("withTimeoutCleanup", () => {
  it("runs cleanup when the execution times out", async () => {
    let cleanupCalls = 0;

    await assert.rejects(
      withTimeoutCleanup(
        () => new Promise(() => {}),
        {
          cleanup: async () => {
            cleanupCalls += 1;
          },
          timeoutMs: 10,
        },
      ),
      /execution timed out/,
    );
    assert.equal(cleanupCalls, 1);
  });

  it("disposes a resource registered after timeout cleanup", async () => {
    const disposed = [];
    const registry = new ResourceRegistry(async (resource) => {
      disposed.push(resource);
    });
    let releaseTask;
    const taskGate = new Promise((resolve) => {
      releaseTask = resolve;
    });
    let taskPromise;

    await assert.rejects(
      withTimeoutCleanup(
        () => {
          taskPromise = (async () => {
            await taskGate;
            await registry.register("late browser");
          })();
          return taskPromise;
        },
        { cleanup: () => registry.cleanup(), timeoutMs: 10 },
      ),
      /execution timed out/,
    );

    releaseTask();
    await assert.rejects(taskPromise, /Resource registry is closed/);
    assert.deepEqual(disposed, ["late browser"]);
  });
});

describe("elementCenterAfterScroll", () => {
  it("measures after an instant scroll has settled", async () => {
    const calls = [];
    const evaluate = async (expression) => {
      calls.push(expression.includes("scrollIntoView") ? "scroll" : "measure");
      if (expression.includes("scrollIntoView")) {
        assert.match(expression, /behavior: "instant"/);
        return undefined;
      }
      return { x: 12, y: 34 };
    };

    const point = await elementCenterAfterScroll(
      evaluate,
      "#email",
      async () => calls.push("settle"),
    );

    assert.deepEqual(calls, ["scroll", "settle", "measure"]);
    assert.deepEqual(point, { x: 12, y: 34 });
  });
});

describe("pressEnter", () => {
  it("sends the text-bearing keyDown Chrome uses for native activation", async () => {
    const events = [];
    await pressEnter({
      send: async (_method, event) => events.push(event),
    });

    assert.deepEqual(events, [
      {
        code: "Enter",
        key: "Enter",
        nativeVirtualKeyCode: 13,
        text: "\r",
        type: "keyDown",
        unmodifiedText: "\r",
        windowsVirtualKeyCode: 13,
      },
      {
        code: "Enter",
        key: "Enter",
        nativeVirtualKeyCode: 13,
        type: "keyUp",
        windowsVirtualKeyCode: 13,
      },
    ]);
  });
});

describe("pressArrow", () => {
  it("sends native left, right, and down arrow key events", async () => {
    const events = [];
    const client = {
      send: async (_method, event) => events.push(event),
    };

    await pressArrow(client, "right");
    await pressArrow(client, "left");
    await pressArrow(client, "down");

    assert.deepEqual(events, [
      {
        code: "ArrowRight",
        key: "ArrowRight",
        nativeVirtualKeyCode: 39,
        type: "rawKeyDown",
        windowsVirtualKeyCode: 39,
      },
      {
        code: "ArrowRight",
        key: "ArrowRight",
        nativeVirtualKeyCode: 39,
        type: "keyUp",
        windowsVirtualKeyCode: 39,
      },
      {
        code: "ArrowLeft",
        key: "ArrowLeft",
        nativeVirtualKeyCode: 37,
        type: "rawKeyDown",
        windowsVirtualKeyCode: 37,
      },
      {
        code: "ArrowLeft",
        key: "ArrowLeft",
        nativeVirtualKeyCode: 37,
        type: "keyUp",
        windowsVirtualKeyCode: 37,
      },
      {
        code: "ArrowDown",
        key: "ArrowDown",
        nativeVirtualKeyCode: 40,
        type: "rawKeyDown",
        windowsVirtualKeyCode: 40,
      },
      {
        code: "ArrowDown",
        key: "ArrowDown",
        nativeVirtualKeyCode: 40,
        type: "keyUp",
        windowsVirtualKeyCode: 40,
      },
    ]);
  });
});

describe("default browser identity flow", () => {
  it("creates the ephemeral user through the sign-up UI only", async () => {
    const source = await readFile(
      new URL("./browser-identity-gate.mjs", import.meta.url),
      "utf8",
    );

    assert.doesNotMatch(source, /createLocalIdentity/);
    assert.doesNotMatch(source, /method:\s*"POST"/);
    assert.match(source, /button\[data-auth-action="signup"\]/);
  });
});

describe("hasVisibleFocusIndicator", () => {
  it("accepts an outline on the focused element", () => {
    assert.equal(
      hasVisibleFocusIndicator({
        focusVisible: true,
        focusWithin: false,
        focusWithinBorderColorAfter: undefined,
        focusWithinBorderColorBefore: undefined,
        focusWithinBoxShadowAfter: undefined,
        focusWithinBoxShadowBefore: undefined,
        outlineStyle: "solid",
        outlineWidth: "3px",
      }),
      true,
    );
  });

  it("accepts a composite focus-within indicator", () => {
    assert.equal(
      hasVisibleFocusIndicator({
        focusVisible: true,
        focusWithin: true,
        focusWithinBorderColorAfter: "rgb(113, 51, 74)",
        focusWithinBorderColorBefore: "rgb(234, 219, 212)",
        focusWithinBoxShadowAfter: "rgb(0 0 0 / 11%) 0px 13px 38px",
        focusWithinBoxShadowBefore: "rgb(0 0 0 / 9%) 0px 18px 50px",
        outlineStyle: "none",
        outlineWidth: "0px",
      }),
      true,
    );
  });

  it("rejects an unchanged ambient box shadow", () => {
    assert.equal(
      hasVisibleFocusIndicator({
        focusVisible: true,
        focusWithin: true,
        focusWithinBorderColorAfter: "rgb(234, 219, 212)",
        focusWithinBorderColorBefore: "rgb(234, 219, 212)",
        focusWithinBoxShadowAfter: "rgb(0 0 0 / 9%) 0px 18px 50px",
        focusWithinBoxShadowBefore: "rgb(0 0 0 / 9%) 0px 18px 50px",
        outlineStyle: "none",
        outlineWidth: "0px",
      }),
      false,
    );
  });

  it("rejects focus without a visible indicator", () => {
    assert.equal(
      hasVisibleFocusIndicator({
        focusVisible: true,
        focusWithin: false,
        focusWithinBorderColorAfter: undefined,
        focusWithinBorderColorBefore: undefined,
        focusWithinBoxShadowAfter: undefined,
        focusWithinBoxShadowBefore: undefined,
        outlineStyle: "none",
        outlineWidth: "0px",
      }),
      false,
    );
  });
});
