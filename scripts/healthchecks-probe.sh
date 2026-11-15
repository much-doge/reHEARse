#!/usr/bin/env bash
set -euo pipefail

CONFIG_PATH="${HEALTHCHECK_CONFIG:-monitoring/services.json}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to read $CONFIG_PATH" >&2
  exit 2
fi

if [[ ! -r "$CONFIG_PATH" ]]; then
  echo "Monitoring service template not found: $CONFIG_PATH" >&2
  exit 2
fi

fail=0

signal() {
  local ping_url="$1" signal_path="${2:-}"
  # A Healthchecks ping URL is a credential. Never print it in CI logs.
  curl --fail --silent --show-error --max-time 10 \
    "${ping_url%/}${signal_path}" >/dev/null 2>/dev/null
}

probe() {
  local label="$1" endpoint="$2" ping_url="$3"

  if curl --fail --silent --show-error --location --max-time 15 \
    --retry 2 --retry-delay 1 "$endpoint" >/dev/null; then
    signal "$ping_url"
    echo "$label: healthy"
    return 0
  fi

  # Make a failed external probe visible immediately instead of leaving the
  # previous green heartbeat in place until the normal grace period expires.
  signal "$ping_url" "/fail" || true
  echo "::error title=$label unavailable::$endpoint did not return a successful response"
  return 1
}

while IFS= read -r service; do
  label="$(jq -r '.label' <<<"$service")"
  endpoint_env="$(jq -r '.endpointEnv' <<<"$service")"
  ping_env="$(jq -r '.pingSecretEnv' <<<"$service")"
  required="$(jq -r '.required // false' <<<"$service")"

  endpoint="${!endpoint_env:-}"
  ping_url="${!ping_env:-}"

  if [[ -z "$endpoint" && -z "$ping_url" && "$required" != "true" ]]; then
    echo "$label: skipped (optional service is not configured)"
    continue
  fi
  if [[ -z "$endpoint" || -z "$ping_url" ]]; then
    echo "::error title=$label incomplete configuration::set $endpoint_env and $ping_env"
    fail=1
    continue
  fi

  probe "$label" "$endpoint" "$ping_url" || fail=1
done < <(jq -c '.services[]' "$CONFIG_PATH")

exit "$fail"
