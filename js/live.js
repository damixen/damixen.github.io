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

    document.getElementById("updated").textContent =
      `Updated ${timeAgo(telemetry.updated_at)}`;

    updateProtocols(telemetry.protocols);

    updateCountries(telemetry.countries);

    updateHoneypots(telemetry.honeypot_types);

    updateSparkline(telemetry.sparkline);

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

  status.className = error ? "status-note error" : "status-note";

  if (!error) {
    setTimeout(() => {
      status.textContent = "";
    }, 3000);
  }
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

function formatNumber(value) {
  if (value >= 1000) {
    return Math.round(value / 1000) + "k";
  }

  return value;
}

function updateSparkline(values) {
  console.log(values.length);

  const svg = document.getElementById("sparkline");

  if (!values || values.length === 0) {
    svg.innerHTML = "";

    return;
  }

  const width = 400;
  const height = 180;

  const paddingLeft = 42;
  const paddingRight = 8;
  const paddingTop = 10;
  const paddingBottom = 12;

  const chartWidth = width - paddingLeft - paddingRight;

  const chartHeight = height - paddingTop - paddingBottom;

  // ---------- Y scale ----------

  const maxValue = Math.max(...values);

  const max =
    maxValue <= 5000
      ? Math.ceil(maxValue / 1000) * 1000
      : maxValue <= 20000
        ? Math.ceil(maxValue / 5000) * 5000
        : Math.ceil(maxValue / 10000) * 10000;

  const step = max <= 5000 ? 1000 : max <= 20000 ? 5000 : 10000;

  function formatYAxis(value) {
    if (value >= 1000) {
      return Math.round(value / 1000) + "k";
    }

    return Math.round(value).toString();
  }

  // ---------- Generate Y labels ----------

  const yLabels = [];

  for (let value = max; value >= 0; value -= step) {
    const y = paddingTop + chartHeight - (value / max) * chartHeight;

    yLabels.push({
      value,
      y,
    });
  }

  const yAxis = yLabels
    .map(
      (label) => `
        <text
            class="axis-label"
            x="${paddingLeft - 8}"
            y="${label.y}"
            text-anchor="end"
            dominant-baseline="middle">
            ${formatYAxis(label.value)}
        </text>
    `,
    )
    .join("");

  // ---------- Generate grid ----------

  const gridLines = yLabels
    .map((label) => {
      if (label.value === max || label.value === 0) {
        return "";
      }

      return `
        <line
            class="grid"
            x1="${paddingLeft}"
            y1="${label.y}"
            x2="${width - paddingRight}"
            y2="${label.y}">
        </line>
      `;
    })
    .join("");

  // ---------- Data points ----------

  const points = values
    .map((value, index) => {
      const x = paddingLeft + (index / (values.length - 1)) * chartWidth;

      const y = paddingTop + chartHeight - (value / max) * chartHeight;

      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints =
    `${paddingLeft},${height - paddingBottom} ` +
    points +
    ` ${width - paddingRight},${height - paddingBottom}`;

  const circles = values
    .map((value, index) => {
      const x = paddingLeft + (index / (values.length - 1)) * chartWidth;

      const y = paddingTop + chartHeight - (value / max) * chartHeight;

      return `
        <circle
            class="sparkline-point"
            cx="${x}"
            cy="${y}"
            r="2.5">
        </circle>
      `;
    })
    .join("");

  // ---------- Render ----------

  svg.innerHTML = `

        <!-- Grid -->

        ${gridLines}


        <!-- Y axis -->

        <line
            class="axis"
            x1="${paddingLeft}"
            y1="${paddingTop}"
            x2="${paddingLeft}"
            y2="${height - paddingBottom}">
        </line>


        <!-- X axis -->

        <line
            class="axis"
            x1="${paddingLeft}"
            y1="${height - paddingBottom}"
            x2="${width - paddingRight}"
            y2="${height - paddingBottom}">
        </line>


        <!-- Y labels -->

        ${yAxis}


        <!-- Area -->

        <polygon
            class="sparkline-fill"
            points="${areaPoints}">
        </polygon>


        <!-- Data line -->

        <polyline
            class="sparkline-line"
            points="${points}">
        </polyline>


        <!-- Data points -->

        ${circles}

  `;
}

function updateModeState() {
  const mode = document.querySelector('input[name="mode"]:checked').value;

  const date = document.getElementById("date");

  const load = document.getElementById("load-feed");

  if (mode === "daily") {
    date.disabled = false;

    load.disabled = false;
  } else {
    date.disabled = true;

    load.disabled = true;
  }
}

document.querySelectorAll('input[name="mode"]').forEach((input) => {
  input.addEventListener("change", () => {
    updateModeState();

    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (mode === "latest") {
      loadFeed();
    }
  });
});

updateModeState();

function timeAgo(timestamp) {
  const now = new Date();

  const updated = new Date(timestamp);

  const seconds = Math.floor((now - updated) / 1000);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  return `${days} day${days === 1 ? "" : "s"} ago`;
}
