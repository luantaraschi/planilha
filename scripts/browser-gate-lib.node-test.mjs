import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CdpClient,
  elementCenterAfterScroll,
  hasVisibleFocusIndicator,
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

describe("hasVisibleFocusIndicator", () => {
  it("accepts an outline on the focused element", () => {
    assert.equal(
      hasVisibleFocusIndicator({
        focusVisible: true,
        focusWithinBoxShadow: "none",
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
        focusWithinBoxShadow: "rgb(0 0 0 / 10%) 0px 13px 38px",
        outlineStyle: "none",
        outlineWidth: "0px",
      }),
      true,
    );
  });

  it("rejects focus without a visible indicator", () => {
    assert.equal(
      hasVisibleFocusIndicator({
        focusVisible: true,
        focusWithinBoxShadow: "none",
        outlineStyle: "none",
        outlineWidth: "0px",
      }),
      false,
    );
  });
});
