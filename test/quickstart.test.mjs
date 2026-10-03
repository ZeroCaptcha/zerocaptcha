// quickstart.sh against a stand-in for the ZeroCaptcha REST API: no key, no real task, nothing
// spent. It needs bash, curl and jq; where one is missing the tests are skipped, and say why.
import assert from "node:assert/strict";
import { execFile, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { after, before, beforeEach, test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const script = fileURLToPath(new URL("../quickstart.sh", import.meta.url));
const missing = ["bash", "curl", "jq"].filter(
  (tool) => spawnSync(tool, ["--version"], { encoding: "utf8" }).status !== 0,
);
const skip = missing.length === 0 ? false : `${missing.join(", ")} not on PATH`;

const KEY = "zc_live_test_key";
const TOKEN = "0.stand-in-turnstile-token";
const PAGE = "https://shop.example.com/login";
const SITEKEY = "0x4AAAAAAAB1cD2eF3gH4iJ5";

let server;
let api;
let scenario = "success";
const requests = [];

/** Answers a request with JSON. */
function send(response, status, value) {
  response.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify(value));
}

before(async () => {
  let polls = 0;
  server = createServer((request, response) => {
    let text = "";
    request.on("data", (chunk) => (text += chunk));
    request.on("end", () => {
      requests.push({
        method: request.method,
        path: request.url,
        key: request.headers["idempotency-key"],
        body: text === "" ? undefined : JSON.parse(text),
      });
      if (request.headers.authorization !== `Bearer ${KEY}`) {
        return send(response, 401, { code: "unauthorized", detail: "The key is not valid." });
      }
      if (request.method === "POST") {
        if (scenario === "insufficient-funds") {
          return send(response, 402, {
            code: "insufficient_funds",
            detail: "Add funds and try again.",
          });
        }
        polls = 0;
        return send(response, 201, { id: "task-1", status: "queued" });
      }
      polls += 1;
      if (scenario === "failed") {
        return send(response, 200, {
          id: "task-1",
          status: "failed",
          errorCode: "ERROR_CAPTCHA_UNSOLVABLE",
          errorDescription: "Not solved.",
        });
      }
      if (polls === 1) return send(response, 200, { id: "task-1", status: "running" });
      return send(response, 200, { id: "task-1", status: "succeeded", solution: { token: TOKEN } });
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  api = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
beforeEach(() => {
  requests.length = 0;
  scenario = "success";
});

const quickstart = (...args) =>
  run("bash", [script, ...args], {
    env: {
      ...process.env,
      ZEROCAPTCHA_API: api,
      ZEROCAPTCHA_KEY: KEY,
      ZEROCAPTCHA_POLL_SECONDS: "0",
    },
  });

test("prints the token", { skip }, async () => {
  const { stdout } = await quickstart(PAGE, SITEKEY, "login", "session-7f3a9c2e");
  assert.equal(stdout.trim(), TOKEN);
  // The widget's action and cData reach the API, so a site that checks them accepts the token.
  assert.deepEqual(requests[0].body, {
    type: "TurnstileTaskProxyless",
    websiteURL: PAGE,
    websiteKey: SITEKEY,
    action: "login",
    cdata: "session-7f3a9c2e",
  });
  assert.match(requests[0].key, /^[0-9a-f]{32}$/);
  assert.deepEqual(
    requests.map((request) => `${request.method} ${request.path}`),
    ["POST /v1/tasks", "GET /v1/tasks/task-1", "GET /v1/tasks/task-1"],
  );
});

test("a failed task prints its code and exits 1", { skip }, async () => {
  scenario = "failed";
  await assert.rejects(quickstart(PAGE, SITEKEY), (error) => {
    assert.equal(error.code, 1);
    assert.equal(error.stderr.trim(), "ERROR_CAPTCHA_UNSOLVABLE: Not solved.");
    return true;
  });
});

test("a refusal prints its code and exits 1", { skip }, async () => {
  scenario = "insufficient-funds";
  await assert.rejects(quickstart(PAGE, SITEKEY), (error) => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /insufficient_funds: Add funds and try again\./);
    return true;
  });
});
