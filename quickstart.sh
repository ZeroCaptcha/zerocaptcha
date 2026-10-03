#!/usr/bin/env bash
# Solve one Cloudflare Turnstile widget with the ZeroCaptcha REST API and print its token.
#
#   export ZEROCAPTCHA_API=https://api.zerocaptcha.io ZEROCAPTCHA_KEY=zc_live_...
#   ./quickstart.sh https://shop.example.com/login 0x4AAAAAAAB1cD2eF3gH4iJ5 [action] [cdata]
#
# action and cdata are the widget's data-action and data-cdata (or turnstile.render()'s action and
# cData options): pass them whenever the widget sets them, since many sites check both when they
# verify the token. Needs bash, curl 7.76 or later and jq. Set PROXY_URL to solve through your own
# proxy.
set -euo pipefail

usage="usage: quickstart.sh <page URL> <sitekey> [action] [cdata]"
page=${1:?$usage}
sitekey=${2:?$usage}
action=${3:-}
cdata=${4:-}
: "${ZEROCAPTCHA_API:?Set ZEROCAPTCHA_API to the API address}"
: "${ZEROCAPTCHA_KEY:?Set ZEROCAPTCHA_KEY to your API key}"
proxy=${PROXY_URL:-}
interval=${ZEROCAPTCHA_POLL_SECONDS:-2}
deadline=$((SECONDS + ${ZEROCAPTCHA_TIMEOUT_SECONDS:-180}))

body=$(jq -n --arg url "$page" --arg key "$sitekey" --arg action "$action" --arg cdata "$cdata" \
  --arg proxy "$proxy" '
  {type: (if $proxy == "" then "TurnstileTaskProxyless" else "TurnstileTask" end),
   websiteURL: $url, websiteKey: $key}
  + (if $action == "" then {} else {action: $action} end)
  + (if $cdata == "" then {} else {cdata: $cdata} end)
  + (if $proxy == "" then {} else {proxy: $proxy} end)')

# One key per task: curl's retries (429 and 5xx, after the Retry-After the API sends) resend it,
# and the API returns the first task instead of making another.
idempotency_key=$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')
auth=(-H "Authorization: Bearer $ZEROCAPTCHA_KEY" -H "Accept: application/json")

# Prints the API's code and message from a problem document or a task, then stops.
fail() {
  jq -r '"\(.code // .errorCode // .status // "error"): \(.detail // .errorDescription // "no details")"' <<<"$1" >&2 ||
    printf '%s\n' "$1" >&2
  exit 1
}

task=$(curl -sS --retry 3 --fail-with-body "${auth[@]}" -H "Content-Type: application/json" \
  -H "Idempotency-Key: $idempotency_key" -d "$body" "$ZEROCAPTCHA_API/v1/tasks") || fail "$task"
id=$(jq -r .id <<<"$task")

while :; do
  status=$(jq -r .status <<<"$task")
  case $status in
    queued | running) ;;
    succeeded)
      jq -r .solution.token <<<"$task"
      exit 0
      ;;
    *) fail "$task" ;;
  esac
  if ((SECONDS + interval >= deadline)); then
    echo "timeout: task $id was still $status at the deadline" >&2
    exit 1
  fi
  sleep "$interval"
  task=$(curl -sS --retry 3 --fail-with-body "${auth[@]}" "$ZEROCAPTCHA_API/v1/tasks/$id") || fail "$task"
done
