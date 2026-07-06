const API =
  "https://faas-sfo3-7872a1dd.doserverless.co/api/v1/web/fn-933ccc11-379c-4af1-aeaa-8df5f5daf1e3/default/telemetry?host_id=hp-do-sfo3&mode=latest";

async function refreshTelemetry() {
    try {
        const response = await fetch(API);

        if (!response.ok)
            throw new Error(`HTTP ${response.status}`);

        const telemetry = await response.json();

        document.getElementById("events").textContent =
            telemetry.events.toLocaleString();

        document.getElementById("uniqueIps").textContent =
            telemetry.unique_ips.toLocaleString();

        document.getElementById("countryCount").textContent =
            telemetry.countries.length;

        const updated =
            new Date(telemetry.updated_at).toLocaleString();

        document.getElementById("telemetry-updated").textContent =
            `Last updated: ${updated}`;

    }
    catch (err) {

        document.getElementById("telemetry-updated").textContent =
            "Unable to load telemetry.";

        console.error(err);
    }
}

refreshTelemetry();

setInterval(refreshTelemetry, 60000);