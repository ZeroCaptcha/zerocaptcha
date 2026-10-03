<!-- zc:header (generated from the registry; edit repos/registry.json) -->
# ZeroCaptcha: Cloudflare Turnstile solver API

[![CI](https://github.com/ZeroCaptcha/zerocaptcha/actions/workflows/ci.yml/badge.svg)](https://github.com/ZeroCaptcha/zerocaptcha/actions/workflows/ci.yml)

ZeroCaptcha, the Cloudflare Turnstile solver API: send a page URL and sitekey, get a Cloudflare Turnstile token or a cf_clearance cookie back. REST, createTask and in.php formats, official SDKs, MCP server and tested examples. Prepaid in USD; failed tasks cost nothing.

[Website](https://zerocaptcha.io) · [Docs](https://zerocaptcha.io/docs) · [Quickstart](https://zerocaptcha.io/docs/quickstart) · [API reference](https://zerocaptcha.io/docs/reference/api) · [Pricing](https://zerocaptcha.io/pricing)
<!-- /zc:header -->

## What ZeroCaptcha is

ZeroCaptcha is a CAPTCHA-solving API for developers who automate, test or collect data on sites they are allowed to access. It solves two things:

- **Cloudflare Turnstile widgets:** send the page's URL and the widget's sitekey, and get a token to submit with the form.
- **Cloudflare challenge pages** ("Just a moment..."): send the page and your proxy, and get the `cf_clearance` cookie with the user agent it is bound to.

You pay per solved task from a prepaid balance in US dollars; a task that fails or expires costs nothing. There is one kind of API key, and every task is a real one.

## Quickstart

1. Create an account on the [website](https://zerocaptcha.io): an email and a password, then the dashboard.
2. Create an API key (`zc_live_…`) and add funds: crypto through NOWPayments, from $10.
3. Create a task and wait for its token, here with `quickstart.sh` (bash, curl and jq):

   ```sh
   export ZEROCAPTCHA_API=https://api.zerocaptcha.io
   export ZEROCAPTCHA_KEY=zc_live_...
   ./quickstart.sh https://shop.example.com/login 0x4AAAAAAAB1cD2eF3gH4iJ5 login session-7f3a9c2e
   ```

   The arguments are the page with the widget, its `data-sitekey`, and its `data-action` and `data-cdata` when it sets them (or the `action` and `cData` options of `turnstile.render()`). Many sites check the action and cData when they verify the token, so pass both whenever the widget sets them.

4. Submit the token in the form's `cf-turnstile-response` field within 300 seconds.

The [quickstart](https://zerocaptcha.io/docs/quickstart) shows the same in Python, Node.js and Go.

## The API

One host answers three formats, so the client you have probably works already:

| Format | Calls | For |
| --- | --- | --- |
| REST | `POST /v1/tasks`, `GET /v1/tasks/{id}`, `GET /v1/balance` | new code and the official SDKs: idempotency keys, RFC 9457 errors, signed callbacks |
| createTask | `createTask`, `getTaskResult`, `getBalance` | clients written for CapSolver, Anti-Captcha or 2Captcha's JSON API |
| in.php and res.php | `in.php?method=turnstile`, `res.php?action=get` | clients written for 2Captcha's original API |

Task types: `TurnstileTaskProxyless`, `TurnstileTask` (through your `http` or `https` proxy) and `CloudflareChallengeTask` (always through your proxy), with CapSolver's names as aliases. The [API reference](https://zerocaptcha.io/docs/reference/api) is generated from the API's own [OpenAPI document](https://zerocaptcha.io/docs/reference/api/contract).

## Repositories

- **Start here:** [cloudflare-turnstile-solver](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver) (a command-line solver and a map of everything) and [cloudflare-challenge-solver](https://github.com/ZeroCaptcha/cloudflare-challenge-solver) (the `cf_clearance` cookie).
- **SDKs:** [zerocaptcha-js](https://github.com/ZeroCaptcha/zerocaptcha-js), [zerocaptcha-python](https://github.com/ZeroCaptcha/zerocaptcha-python) and [zerocaptcha-go](https://github.com/ZeroCaptcha/zerocaptcha-go).
- **AI assistants:** [zerocaptcha-mcp](https://github.com/ZeroCaptcha/zerocaptcha-mcp), a Model Context Protocol server.
- **Examples:** Python, Node.js, Go, PHP, Java, C#, Rust, Playwright, Puppeteer and Selenium, each tested; see the table in [cloudflare-turnstile-solver](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver#examples-in-your-language).
- **Moving from another service:** [createtask-api-migration](https://github.com/ZeroCaptcha/createtask-api-migration).
- **A curated list:** [awesome-cloudflare-turnstile](https://github.com/ZeroCaptcha/awesome-cloudflare-turnstile).

## Honest limits

- **Cloudflare Turnstile and Cloudflare challenge pages only.** No reCAPTCHA, hCaptcha or image CAPTCHAs.
- **Tokens work once, for 300 seconds;** clearances as long as the site's Challenge Passage allows.
- **No SOCKS proxies,** and no proxyless challenge task: a clearance works only from the address that earned it.
- **Top-ups are final,** in crypto only, from $10 with no maximum.
- **For sites you own or are allowed to automate.** The [Acceptable Use Policy](https://zerocaptcha.io/legal/acceptable-use) applies; staff act on [abuse reports](https://zerocaptcha.io/report-abuse) by hand, and any site owner can [opt out](https://zerocaptcha.io/opt-out).

## FAQ

**How much does it cost?**
The [pricing page](https://zerocaptcha.io/pricing) lists the price per 1,000 solved tasks for each task type, as the API publishes them. Failed tasks cost nothing.

**Is there a rate limit?**
Not on creating paid tasks. Reads share a budget, so poll every 2 seconds or use a callback; see [rate limits](https://zerocaptcha.io/docs/rate-limits).

**Is it up?**
The [status page](https://zerocaptcha.io/status) shows the last 24 hours, read live from the API.

**Where do I get help?**
The [docs](https://zerocaptcha.io/docs), the [FAQ](https://zerocaptcha.io/docs/reference/faq), and [support](https://zerocaptcha.io/contact) for anything about your account or a task. Security issues: report them privately through GitHub's advisory form on the affected repository.

## Run the tests

```sh
node --test
```

The tests run `quickstart.sh` against a stand-in API on your machine (they need bash, curl and jq, and skip with the reason where one is missing): no key, no real task, nothing spent.

<!-- zc:footer (generated from the registry) -->
## More from ZeroCaptcha

- The website: [ZeroCaptcha](https://zerocaptcha.io), the [docs](https://zerocaptcha.io/docs), the [guides](https://zerocaptcha.io/guides), the [blog](https://zerocaptcha.io/blog) and the [status page](https://zerocaptcha.io/status)
- Start here: **zerocaptcha**, [cloudflare-turnstile-solver](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver), [cloudflare-challenge-solver](https://github.com/ZeroCaptcha/cloudflare-challenge-solver)
- Examples by language: [cloudflare-turnstile-solver-python](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-python), [cloudflare-turnstile-solver-nodejs](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-nodejs), [cloudflare-turnstile-solver-go](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-go), [cloudflare-turnstile-solver-php](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-php), [cloudflare-turnstile-solver-java](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-java), [cloudflare-turnstile-solver-csharp](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-csharp), [cloudflare-turnstile-solver-rust](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-rust)
- Browser automation: [cloudflare-turnstile-solver-playwright](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-playwright), [cloudflare-turnstile-solver-puppeteer](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-puppeteer), [cloudflare-turnstile-solver-selenium](https://github.com/ZeroCaptcha/cloudflare-turnstile-solver-selenium)
- SDKs, MCP server and migration: [zerocaptcha-js](https://github.com/ZeroCaptcha/zerocaptcha-js), [zerocaptcha-python](https://github.com/ZeroCaptcha/zerocaptcha-python), [zerocaptcha-go](https://github.com/ZeroCaptcha/zerocaptcha-go), [zerocaptcha-mcp](https://github.com/ZeroCaptcha/zerocaptcha-mcp), [createtask-api-migration](https://github.com/ZeroCaptcha/createtask-api-migration)
- Lists: [awesome-cloudflare-turnstile](https://github.com/ZeroCaptcha/awesome-cloudflare-turnstile)

## Licence

MIT: see [LICENSE](LICENSE).

## Disclaimer

ZeroCaptcha is an independent service, not affiliated with or endorsed by Cloudflare. Cloudflare and Turnstile are trademarks of Cloudflare, Inc. Use ZeroCaptcha only on sites you own or are allowed to automate, as the [Acceptable Use Policy](https://zerocaptcha.io/legal/acceptable-use) says; any site owner can [opt out](https://zerocaptcha.io/opt-out).
<!-- /zc:footer -->
