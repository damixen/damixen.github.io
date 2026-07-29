const API_BASE =
  "https://faas-sfo3-7872a1dd.doserverless.co/api/v1/web/fn-933ccc11-379c-4af1-aeaa-8df5f5daf1e3/live-telemetry/telemetry";

async function loadFeed() {
  setFeedStatus("Loading telemetry...");

  const host = document.getElementById("host").value;

  const mode = document.querySelector('input[name="mode"]:checked').value;

  const date = document.getElementById("date").value;

  let url = `${API_BASE}?host_id=${host}&mode=${mode}`;

  if (mode === "daily") {
    if (!date) {
      setFeedStatus("Please select a date for daily reports.", true);

      return;
    }

    url += `&date=${date}`;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const telemetry = await response.json();

    document.getElementById("events").textContent =
      telemetry.events.toLocaleString();

    document.getElementById("uniqueIps").textContent =
      telemetry.unique_ips.toLocaleString();

    document.getElementById("countryCount").textContent =
      telemetry.countries.length;

    document.getElementById("updated").textContent = new Date(
      telemetry.updated_at,
    ).toLocaleString();

    updateProtocols(telemetry.protocols);

    updateCountries(telemetry.countries);

    updateHoneypots(telemetry.honeypot_types);

    setFeedStatus("Telemetry loaded successfully.");
  } catch (error) {
    console.error(error);

    setFeedStatus(`Unable to load telemetry: ${error.message}`, true);
  }
}

document.getElementById("load-feed").addEventListener("click", loadFeed);

setDefaultDate();

loadFeed();

function updateProtocols(protocols) {
  console.log("Protocols:", protocols);

  const table = document.getElementById("protocols-table");

  table.innerHTML = "";

  protocols.forEach((item) => {
    table.innerHTML += `

        <tr>

            <td>
                ${item.protocol}
            </td>

            <td>
                ${item.count.toLocaleString()}
            </td>

        </tr>

        `;
  });
}

function updateCountries(countries) {
  const table = document.getElementById("countries-table");

  table.innerHTML = "";

  countries.forEach((item) => {
    table.innerHTML += `

        <tr>

            <td>
                ${item.country}
            </td>

            <td>
                ${item.count.toLocaleString()}
            </td>

        </tr>

        `;
  });
}

function updateHoneypots(honeypots) {
  const table = document.getElementById("honeypots-table");

  table.innerHTML = "";

  honeypots.forEach((item) => {
    table.innerHTML += `

        <tr>

            <td>
                ${item.type}
            </td>

            <td>
                ${item.count.toLocaleString()}
            </td>

        </tr>

        `;
  });
}

function updateDateState() {
  const mode = document.querySelector('input[name="mode"]:checked').value;

  const date = document.getElementById("date");

  date.disabled = mode !== "daily";
}

document.querySelectorAll('input[name="mode"]').forEach((input) => {
  input.addEventListener("change", updateDateState);
});

updateDateState();

function setFeedStatus(message, error = false) {
  const status = document.getElementById("feed-status");

  status.textContent = message;

  status.className = error ? "feed-status" : "";
}

function setDefaultDate() {
  const dateInput = document.getElementById("date");

  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  const yyyy = yesterday.getFullYear();

  const mm = String(yesterday.getMonth() + 1).padStart(2, "0");

  const dd = String(yesterday.getDate()).padStart(2, "0");

  dateInput.value = `${yyyy}-${mm}-${dd}`;
}
