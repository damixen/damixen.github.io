const API_BASE =
"https://faas-sfo3-7872a1dd.doserverless.co/api/v1/web/fn-933ccc11-379c-4af1-aeaa-8df5f5daf1e3/live-telemetry/telemetry";

const params = new URLSearchParams({
  host_id: "hp-do-sfo3",
  mode: "latest",
});

const API = `${API_BASE}?${params}`;

  function validateTelemetry(telemetry) {
  return (
    telemetry &&
    typeof telemetry.events === "number" &&
    typeof telemetry.unique_ips === "number" &&
    Array.isArray(telemetry.countries) &&
    typeof telemetry.updated_at === "string"
  );
}

async function fetchWithTimeout(url, timeout = 10000) {
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function refreshTelemetry() {
  try {
    const response = await fetchWithTimeout(API);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const telemetry = await response.json();

    if (!validateTelemetry(telemetry)) {
      throw new Error("Invalid telemetry response");
    }

    document.getElementById("events").textContent =
      telemetry.events.toLocaleString();

    document.getElementById("uniqueIps").textContent =
      telemetry.unique_ips.toLocaleString();

    document.getElementById("countryCount").textContent =
      telemetry.countries.length;

    const updated = new Date(telemetry.updated_at).toLocaleString();

    document.getElementById("telemetry-updated").textContent =
      `Updated: ${updated}`;
  } catch (err) {
    document.getElementById("telemetry-updated").textContent =
      "Unable to load telemetry.";

    console.error(err);
  }
}

refreshTelemetry();

setInterval(refreshTelemetry, 900000);
