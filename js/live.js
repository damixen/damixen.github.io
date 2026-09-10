const API_BASE =
  "https://faas-sfo3-7872a1dd.doserverless.co/api/v1/web/fn-933ccc11-379c-4af1-aeaa-8df5f5daf1e3/live-telemetry/telemetry";

const portServices = {
  20: "FTP-Data",
  21: "FTP",
  22: "SSH",
  23: "Telnet",
  25: "SMTP",
  53: "DNS",
  80: "HTTP",
  81: "HTTP-Alt",
  110: "POP3",
  111: "RPCBind",
  135: "MSRPC",
  139: "NetBIOS",
  143: "IMAP",
  389: "LDAP",
  443: "HTTPS",
  445: "SMB",
  465: "SMTPS",
  514: "Syslog",
  587: "SMTP-Submission",
  631: "IPP",
  993: "IMAPS",
  995: "POP3S",
  1433: "MSSQL",
  1521: "Oracle",
  1723: "PPTP",
  1883: "MQTT",
  2375: "Docker",
  3306: "MySQL",
  3389: "RDP",
  5000: "HTTP-Dev",
  5432: "PostgreSQL",
  5060: "SIP",
  5900: "VNC",
  5985: "WinRM",
  6379: "Redis",
  6443: "Kubernetes API",
  8080: "HTTP-Proxy",
  8443: "HTTPS-Alt",
  9200: "Elasticsearch",
  27017: "MongoDB",
};

async function loadFeed() {
  setFeedStatus("Loading telemetry...");

  const host = document.getElementById("host").value;

  const mode = document.querySelector(
    'input[name="mode"]:checked',
  ).value;

  const date = document.getElementById("date").value;
  let url = `${API_BASE}?host_id=${host}&mode=${mode}`;

  if (mode === "daily") {
    if (!date) {
      setFeedStatus(
        "Please select a date for daily reports.",
        true,
      );

      return;
    }

    url += `&date=${date}`;
  }

  if (mode === "weekly") {
    if (!date) {
      setFeedStatus(
        "Please select a date for weekly reports.",
        true,
      );

      return;
    }

    const selectedDate = new Date(`${date}T00:00:00`);

    const week = getISOWeekId(selectedDate);

    url += `&week=${week}`;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const telemetry = await response.json();

    if (
      !telemetry ||
      typeof telemetry.events !== "number" ||
      typeof telemetry.unique_ips !== "number" ||
      !Array.isArray(telemetry.countries) ||
      !Array.isArray(telemetry.protocols) ||
      !Array.isArray(telemetry.honeypot_types) ||
      !Array.isArray(telemetry.sparkline) ||
      !telemetry.sparkline.every(
        (value) => typeof value === "number",
      )
    ) {
      throw new Error("Invalid telemetry response");
    }

    document.getElementById("events").textContent =
      telemetry.events.toLocaleString();

    document.getElementById("uniqueIps").textContent =
      telemetry.unique_ips.toLocaleString();

    document.getElementById("countryCount").textContent =
      telemetry.countries.length;

    document.getElementById("updated").textContent =
      `Updated ${timeAgo(telemetry.updated_at)}`;

    updatePorts(telemetry.ports);

    updateCountries(telemetry.countries);

    updateHoneypots(
      telemetry.honeypot_types,
      telemetry.cowrie,
      telemetry.dionaea,
      telemetry.sentrypeer,
    );


    const asList = Array.isArray(telemetry.as)
      ? telemetry.as
      : [];

    updateAS(asList);

    updateSparkline(telemetry.sparkline);

    updateModeLabels(mode, date);


    setFeedStatus("Telemetry loaded successfully.");
  } catch (error) {
    console.error(error);

    setFeedStatus(
      "Unable to load telemetry data. Please try again later.",
      true,
    );
  }
}

document
  .getElementById("load-feed")
  .addEventListener("click", loadFeed);

setDefaultDate();
updateDateState();
loadFeed();

function updateProtocols(protocols) {
  const table = document.getElementById("protocols-table");

  table.innerHTML = "";

  protocols.forEach((item) => {
    const row = document.createElement("tr");

    const protocol = document.createElement("td");
    protocol.textContent = item.protocol;

    const count = document.createElement("td");
    count.textContent = item.count.toLocaleString();

    row.appendChild(protocol);
    row.appendChild(count);

    table.appendChild(row);
  });
}

function formatPort(port) {
  return portServices[port]
    ? `${port} (${portServices[port]})`
    : `${port}`;
}

function updatePorts(ports) {
  if (!ports || ports.length === 0) {
    return;
  }

  const portsList = document.getElementById("ports-list");

  portsList.innerHTML = "";

  ports.forEach((port) => {
    const tag = document.createElement("span");

    tag.className = "tag";
    tag.textContent = formatPort(port);

    portsList.appendChild(tag);
  });
}

function updateCountries(countries) {
  const table = document.getElementById("countries-table");

  table.innerHTML = "";

  countries.slice(0, 5).forEach((item) => {
    const row = document.createElement("tr");

    const country = document.createElement("td");
    country.textContent = item.country;

    const count = document.createElement("td");
    count.textContent = item.count.toLocaleString();

    row.appendChild(country);
    row.appendChild(count);

    table.appendChild(row);
  });
}

function updateHoneypots(
  honeypotTypes,
  cowrie,
  dionaea,
  sentrypeer,
) {
  const table =
    document.getElementById("honeypots-table");

  table.innerHTML = "";

  if (!Array.isArray(honeypotTypes)) {
    return;
  }

  const detailsByType = {
    Cowrie: cowrie,
    Dionaea: dionaea,
    Sentrypeer: sentrypeer,
  };

  const hasHpDetails = cowrie || dionaea || sentrypeer

  honeypotTypes.forEach((item) => {
    const row = document.createElement("tr");

    row.setAttribute(
      "aria-expanded",
      "false",
    );

    const honeypot =
      document.createElement("td");

    honeypot.textContent =
      item.type || "Unknown";

    const count =
      document.createElement("td");

    count.textContent =
      typeof item.count === "number"
        ? item.count.toLocaleString()
        : "—";

    const details =
      document.createElement("td");

    details.className =
      "honeypot-details-cell";

    const honeypotDetails =
      detailsByType[item.type];

    row.appendChild(honeypot);
    row.appendChild(count);
    row.appendChild(details);

    if (honeypotDetails) {
      const viewButton =
        document.createElement("button");

      viewButton.className =
        "as-view-button";

      viewButton.type = "button";

      viewButton.textContent =
        "View";

      viewButton.setAttribute(
        "aria-label",
        `View details for ${item.type || "honeypot"}`,
      );

      details.appendChild(viewButton);

      const detailRow =
        document.createElement("tr");

      detailRow.className =
        "honeypot-detail-row";

      detailRow.hidden = true;

      const detailCell =
        document.createElement("td");

      detailCell.colSpan = 3;

      renderHoneypotDetail(
        detailCell,
        item.type,
        honeypotDetails,
      );

      detailRow.appendChild(detailCell);

      const toggleRow = () => {
        const expanded =
          row.getAttribute("aria-expanded") ===
          "true";

        row.setAttribute(
          "aria-expanded",
          String(!expanded),
        );

        detailRow.hidden = expanded;

        viewButton.textContent =
          expanded
            ? "View"
            : "Hide";

        viewButton.classList.toggle(
          "is-expanded",
          !expanded,
        );

        viewButton.setAttribute(
          "aria-label",
          expanded
            ? `View details for ${item.type || "honeypot"}`
            : `Hide details for ${item.type || "honeypot"}`,
        );
      };

      viewButton.addEventListener(
        "click",
        (event) => {
          event.stopPropagation();

          toggleRow();
        },
      );

      table.appendChild(row);
      table.appendChild(detailRow);
    } else {
      if (hasHpDetails) {
        details.textContent = "Coming soon";
      }
      else {
        details.textContent = "-";
      }



      table.appendChild(row);
    }
  });
}

function renderHoneypotDetail(
  container,
  type,
  details,
) {
  if (type === "Cowrie") {
    renderCowrieDetails(
      container,
      details,
    );
    return;
  }

  if (type === "Dionaea") {
    renderDionaeaDetails(
      container,
      details,
    );
    return;
  }

  if (type === "Sentrypeer") {
    renderSentrypeerDetails(
      container,
      details,
    );
  }
}

function createDetailSection(
  container,
  title,
) {
  const section =
    document.createElement("div");

  section.className =
    "honeypot-detail-section";

  container.appendChild(section);

  return section;
}


function renderCommonHoneypotDetails(
  container,
  honeypot,
) {
  if (!honeypot) {
    return;
  }

  const section =
    document.createElement("div");

  section.className =
    "honeypot-detail-grid";

  addDetailMetric(
    section,
    "Activity",
    honeypot.events,
  );

  addDetailMetric(
    section,
    "Unique IPs",
    honeypot.unique_ips,
  );

  addDetailList(
    section,
    "Top Countries",
    honeypot.countries,
    "country",
    "count",
  );

  addASNList(
    section,
    "Top ASNs",
    honeypot.as,
  );

  addDetailList(
    section,
    "Top Ports",
    honeypot.ports,
    "port",
    "count",
    formatPortEntry,
  );

  container.appendChild(section);
}


function formatPortEntry(item) {
  if (!item || item.port === undefined) {
    return "Unknown";
  }

  return formatPort(item.port);
}


function renderCowrieDetails(
  container,
  details,
) {
  if (!details) {
    return;
  }

  const section =
    createDetailSection(
      container,
      "Cowrie Activity",
    );

  renderCommonHoneypotDetails(
    section,
    details,
  );

  addDetailList(
    section,
    "Event Types",
    details.event_types,
    "value",
    "count",
  );

  addDetailList(
    section,
    "Commands",
    details.commands,
    "value",
    "count",
  );

  addDetailList(
    section,
    "Downloads",
    details.downloads,
    "value",
    "count",
  );

  addDetailList(
    section,
    "Files",
    details.files,
    "value",
    "count",
  );

  addDetailList(
    section,
    "SSH Client Fingerprints",
    details.ssh_client_fingerprints,
    "value",
    "count",
  );

  addDetailList(
    section,
    "Credentials",
    details.credentials,
    "username",
    "count",
  );
}


function renderDionaeaDetails(
  container,
  details,
) {
  if (!details) {
    return;
  }

  const section =
    createDetailSection(
      container,
      "Dionaea Activity",
    );

  renderCommonHoneypotDetails(
    section,
    details,
  );

  addDetailList(
    section,
    "Protocols",
    details.protocol,
    "value",
    "count",
  );

  addDetailList(
    section,
    "Credentials",
    details.credentials,
    "username",
    "count",
  );
}


function renderSentrypeerDetails(
  container,
  details,
) {
  if (!details) {
    return;
  }

  const section =
    createDetailSection(
      container,
      "SentryPeer Activity",
    );

  renderCommonHoneypotDetails(
    section,
    details,
  );

  addDetailList(
    section,
    "SIP Methods",
    details.sip_method,
    "value",
    "count",
  );

  addDetailList(
    section,
    "SIP User Agents",
    details.sip_user_agent,
    "value",
    "count",
  );

  renderSourceNumbers(
    section,
    details.source_numbers,
  );
}


function renderSourceNumbers(container, values) {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return;
  }

  const item =
    document.createElement("div");

  item.className =
    "honeypot-detail-item";

  const header =
    document.createElement("button");

  header.className =
    "honeypot-detail-toggle";

  header.type = "button";

  header.setAttribute(
    "aria-expanded",
    "false",
  );

  const labelElement =
    document.createElement("span");

  labelElement.textContent =
    "Source Activity";

  const viewButton =
    document.createElement("span");

  viewButton.className =
    "honeypot-detail-view-button";

  viewButton.textContent =
    "View";

  header.appendChild(labelElement);
  header.appendChild(viewButton);

  const content =
    document.createElement("div");

  content.className =
    "honeypot-detail-content";

  content.hidden = true;

  const table =
    document.createElement("table");

  table.className =
    "dashboard-table honeypot-detail-table";

  // Column headers
  const headerRow =
    document.createElement("tr");

  ["Source IP", "Activity", "Unique Call #"].forEach(
    (text) => {
      const th =
        document.createElement("th");

      th.textContent = text;

      headerRow.appendChild(th);
    },
  );

  table.appendChild(headerRow);

  values.forEach((item) => {
    const row =
      document.createElement("tr");

    const source =
      document.createElement("td");

    source.textContent =
      item.source || "Unknown";

    const events =
      document.createElement("td");

    events.textContent =
      typeof item.events === "number"
        ? item.events.toLocaleString()
        : "—";

    const targets =
      document.createElement("td");

    targets.textContent =
      typeof item.unique_targets === "number"
        ? item.unique_targets.toLocaleString()
        : "—";

    row.appendChild(source);
    row.appendChild(events);
    row.appendChild(targets);

    table.appendChild(row);
  });

  content.appendChild(table);

  header.addEventListener(
    "click",
    () => {
      const expanded =
        header.getAttribute(
          "aria-expanded",
        ) === "true";

      header.setAttribute(
        "aria-expanded",
        String(!expanded),
      );

      content.hidden = expanded;

      viewButton.textContent =
        expanded ? "View" : "Hide";

      viewButton.classList.toggle(
        "is-expanded",
        !expanded,
      );
    },
  );

  item.appendChild(header);
  item.appendChild(content);

  container.appendChild(item);

  const note =
    document.createElement("p");

  note.className =
    "status-note";

  note.textContent =
    "Some events do not contain a called-number value, and values may not represent normalized telephone numbers.";

  container.appendChild(note);
}



function updateAS(asList) {
  const table = document.getElementById("as-table");

  table.innerHTML = "";

  asList.slice(0, 5).forEach((item) => {
    const row = document.createElement("tr");

    const organization = document.createElement("td");
    organization.textContent = item.as_org || "Unknown";

    const asn = document.createElement("td");
    asn.textContent = item.asn
      ? `AS${item.asn}`
      : "Unknown";

    const events = document.createElement("td");
    events.textContent = item.events.toLocaleString();

    const countries = document.createElement("td");

    row.appendChild(organization);
    row.appendChild(asn);
    row.appendChild(events);
    row.appendChild(countries);

    if (item.countries && item.countries.length > 0) {
      const viewButton = document.createElement("button");

      viewButton.className = "as-view-button";
      viewButton.type = "button";
      viewButton.textContent =
        `View (${item.countries.length})`;

      viewButton.setAttribute(
        "aria-label",
        `View ${item.countries.length} countries for ${item.as_org || "AS"
        }`,
      );

      countries.appendChild(viewButton);

      const detailRow = document.createElement("tr");

      detailRow.className = "as-detail-row";
      detailRow.hidden = true;

      const detailCell = document.createElement("td");

      detailCell.colSpan = 4;

      const countryTable =
        document.createElement("table");

      countryTable.className =
        "dashboard-table as-country-table";

      item.countries.forEach((country) => {
        const countryRow = document.createElement("tr");

        const countryName =
          document.createElement("td");

        countryName.textContent = country.country;

        const countryEvents =
          document.createElement("td");

        countryEvents.textContent =
          country.events.toLocaleString();

        countryRow.appendChild(countryName);
        countryRow.appendChild(countryEvents);

        countryTable.appendChild(countryRow);
      });

      detailCell.appendChild(countryTable);
      detailRow.appendChild(detailCell);

      const toggleRow = () => {
        const expanded =
          row.getAttribute("aria-expanded") === "true";

        row.setAttribute(
          "aria-expanded",
          String(!expanded),
        );

        detailRow.hidden = expanded;

        viewButton.textContent = expanded
          ? `View (${item.countries.length})`
          : `Hide (${item.countries.length})`;

        viewButton.classList.toggle(
          "is-expanded",
          !expanded,
        );


        viewButton.setAttribute(
          "aria-label",
          expanded
            ? `View ${item.countries.length} countries for ${item.as_org || "AS"
            }`
            : `Hide ${item.countries.length} countries for ${item.as_org || "AS"
            }`,
        );
      };

      viewButton.addEventListener(
        "click",
        (event) => {
          event.stopPropagation();

          toggleRow();
        },
      );

      table.appendChild(row);
      table.appendChild(detailRow);
    } else {
      countries.textContent = "—";

      table.appendChild(row);
    }
  });
}

function updateDateState() {
  const mode = document.querySelector(
    'input[name="mode"]:checked',
  ).value;

  const date = document.getElementById("date");
  const weekRange = document.getElementById("week-range");

  date.disabled =
    mode !== "daily" && mode !== "weekly";

  if (mode === "weekly") {
    date.max = formatDateInputValue(
      getLastCompletedWeekEnd(),
    );

    if (date.value) {
      const selectedDate = new Date(
        `${date.value}T00:00:00`,
      );

      weekRange.textContent =
        formatWeekRange(selectedDate);
    }
  } else {
    date.removeAttribute("max");
    weekRange.textContent = "";
  }
}

document
  .getElementById("date")
  .addEventListener("change", updateDateState);

function setFeedStatus(message, error = false) {
  const status = document.getElementById("feed-status");

  status.textContent = message;

  status.className = error
    ? "status-note error"
    : "status-note";

  if (!error) {
    setTimeout(() => {
      status.textContent = "";
    }, 3000);
  }
}

function setDefaultDate() {
  const dateInput =
    document.getElementById("date");

  const mode = document.querySelector(
    'input[name="mode"]:checked',
  ).value;

  const date = new Date();

  if (mode === "weekly") {
    const day = date.getDay() || 7;

    // Most recent completed Sunday.
    date.setDate(
      date.getDate() - day,
    );
  } else {
    // Daily: yesterday.
    date.setDate(
      date.getDate() - 1,
    );
  }

  const yyyy = date.getFullYear();
  const mm = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const dd = String(
    date.getDate(),
  ).padStart(2, "0");

  dateInput.value = `${yyyy}-${mm}-${dd}`;
}

function getISOWeekId(date) {
  const utcDate = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    ),
  );

  const day = utcDate.getUTCDay() || 7;

  // Move to Thursday of the current ISO week.
  utcDate.setUTCDate(
    utcDate.getUTCDate() + 4 - day,
  );

  const year = utcDate.getUTCFullYear();

  const yearStart = new Date(
    Date.UTC(year, 0, 1),
  );

  const weekNumber = Math.ceil(
    (
      ((utcDate - yearStart) / 86400000) +
      1
    ) / 7,
  );

  return `${year}-W${String(
    weekNumber,
  ).padStart(2, "0")}`;
}

function getWeekRange(date) {
  const selected = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const day = selected.getDay() || 7;

  const monday = new Date(selected);

  monday.setDate(
    selected.getDate() - day + 1,
  );

  const sunday = new Date(monday);

  sunday.setDate(
    monday.getDate() + 6,
  );

  return {
    monday,
    sunday,
  };
}

function formatWeekRange(date) {
  const { monday, sunday } =
    getWeekRange(date);

  const options = {
    month: "short",
    day: "numeric",
  };

  const mondayText =
    monday.toLocaleDateString(
      undefined,
      options,
    );

  const sundayText =
    sunday.toLocaleDateString(
      undefined,
      options,
    );

  return `Week of ${mondayText} – ${sundayText}`;
}

function formatNumber(value) {
  if (value >= 1000) {
    return (
      Math.round(value / 1000) + "k"
    );
  }

  return value;
}

function updateSparkline(values) {
  const svg =
    document.getElementById("sparkline");

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

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const maxValue =
    Math.max(...values);

  const max =
    maxValue <= 5000
      ? Math.ceil(maxValue / 1000) * 1000
      : maxValue <= 20000
        ? Math.ceil(maxValue / 5000) * 5000
        : Math.ceil(maxValue / 10000) * 10000;

  const step =
    max <= 5000
      ? 1000
      : max <= 20000
        ? 5000
        : 10000;

  function formatYAxis(value) {
    if (value >= 1000) {
      return (
        Math.round(value / 1000) +
        "k"
      );
    }

    return Math.round(value).toString();
  }

  const yLabels = [];

  for (
    let value = max;
    value >= 0;
    value -= step
  ) {
    const y =
      paddingTop +
      chartHeight -
      (value / max) * chartHeight;

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

  const gridLines = yLabels
    .map((label) => {
      if (
        label.value === max ||
        label.value === 0
      ) {
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

  const points = values
    .map((value, index) => {
      const x =
        paddingLeft +
        (index / (values.length - 1)) *
        chartWidth;

      const y =
        paddingTop +
        chartHeight -
        (value / max) * chartHeight;

      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints =
    `${paddingLeft},${height - paddingBottom
    } ` +
    points +
    ` ${width - paddingRight
    },${height - paddingBottom}`;

  const circles = values
    .map((value, index) => {
      const x =
        paddingLeft +
        (index / (values.length - 1)) *
        chartWidth;

      const y =
        paddingTop +
        chartHeight -
        (value / max) * chartHeight;

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

  svg.innerHTML = `
        ${gridLines}

        <line
            class="axis"
            x1="${paddingLeft}"
            y1="${paddingTop}"
            x2="${paddingLeft}"
            y2="${height - paddingBottom}">
        </line>

        <line
            class="axis"
            x1="${paddingLeft}"
            y1="${height - paddingBottom}"
            x2="${width - paddingRight}"
            y2="${height - paddingBottom}">
        </line>

        ${yAxis}

        <polygon
            class="sparkline-fill"
            points="${areaPoints}">
        </polygon>

        <polyline
            class="sparkline-line"
            points="${points}">
        </polyline>

        ${circles}
  `;
}

function updateModeState() {
  const mode = document.querySelector(
    'input[name="mode"]:checked',
  ).value;

  const date =
    document.getElementById("date");

  const load =
    document.getElementById("load-feed");

  const selectableMode =
    mode === "daily" ||
    mode === "weekly";

  date.disabled = !selectableMode;
  load.disabled = !selectableMode;

  updateDateState();
}

document
  .querySelectorAll('input[name="mode"]')
  .forEach((input) => {
    input.addEventListener(
      "change",
      () => {
        updateModeState();

        const mode =
          document.querySelector(
            'input[name="mode"]:checked',
          ).value;

        if (mode === "weekly") {
          setDefaultDate();
          updateDateState();
        }

        if (mode === "latest") {
          loadFeed();
        }
      },
    );
  });

updateModeState();

function timeAgo(timestamp) {
  const now = new Date();

  const updated =
    new Date(timestamp);

  const seconds = Math.floor(
    (now - updated) / 1000,
  );

  if (seconds < 60) {
    return "just now";
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"
      } ago`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"
      } ago`;
  }

  const days =
    Math.floor(hours / 24);

  return `${days} day${days === 1 ? "" : "s"
    } ago`;
}

const toolbar =
  document.querySelector(".live-toolbar");

const hideButton =
  document.getElementById(
    "toggle-controls",
  );

const showButton =
  document.getElementById(
    "show-controls",
  );

hideButton.addEventListener(
  "click",
  () => {
    toolbar.classList.add(
      "collapsed",
    );
  },
);

showButton.addEventListener(
  "click",
  () => {
    toolbar.classList.remove(
      "collapsed",
    );
  },
);

const hostSelect =
  document.getElementById("host");

const modeInputs =
  document.querySelectorAll(
    'input[name="mode"]',
  );

const summarySensor =
  document.getElementById(
    "summary-sensor",
  );

function updateSummary() {
  const hostText =
    hostSelect.options[
      hostSelect.selectedIndex
    ].text;

  summarySensor.textContent =
    `Sensor: ${hostText}`;
}

hostSelect.addEventListener(
  "change",
  updateSummary,
);

modeInputs.forEach((input) => {
  input.addEventListener(
    "change",
    updateSummary,
  );
});

updateSummary();

const checkbox =
  document.getElementById(
    "pin-controls",
  );

const controls =
  document.querySelector(
    ".live-toolbar",
  );

const pinned =
  localStorage.getItem(
    "pinControls",
  ) === "true";

checkbox.checked = pinned;

if (pinned) {
  controls.classList.add("sticky");
}

checkbox.addEventListener(
  "change",
  () => {
    controls.classList.toggle(
      "sticky",
      checkbox.checked,
    );

    localStorage.setItem(
      "pinControls",
      checkbox.checked,
    );
  },
);


function getLastCompletedWeekEnd() {
  const today = new Date();
  const day = today.getDay() || 7; // Sunday = 7

  const lastSunday = new Date(today);
  lastSunday.setDate(
    today.getDate() - day,
  );

  return lastSunday;
}

function formatDateInputValue(date) {
  const yyyy = date.getFullYear();
  const mm = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const dd = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function updateModeLabels(mode, date) {
  const eventsLabel =
    document.getElementById("events-label");

  const trendLabel =
    document.getElementById("trend-label");

  if (mode === "latest") {
    eventsLabel.textContent = "Events (24h)";
    trendLabel.textContent =
      "Time (UTC) — Last 24 Hours";
    return;
  }

  if (mode === "daily") {
    eventsLabel.textContent = "Events (Daily)";

    const selectedDate =
      new Date(`${date}T00:00:00`);

    trendLabel.textContent =
      `Time (UTC) — ${selectedDate.toLocaleDateString(
        undefined,
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      )}`;

    return;
  }

  if (mode === "weekly") {
    eventsLabel.textContent = "Events (Weekly)";

    const selectedDate =
      new Date(`${date}T00:00:00`);

    trendLabel.textContent =
      `Time (UTC) — ${formatWeekRange(selectedDate)}`;
  }
}

function addDetailMetric(
  container,
  label,
  value,
) {
  if (typeof value !== "number") {
    return;
  }

  const item = document.createElement("div");
  item.className = "honeypot-detail-metric";

  const labelElement =
    document.createElement("div");

  labelElement.className =
    "honeypot-detail-label";

  labelElement.textContent = label;

  const valueElement =
    document.createElement("div");

  valueElement.className =
    "honeypot-detail-value";

  valueElement.textContent =
    value.toLocaleString();

  item.appendChild(labelElement);
  item.appendChild(valueElement);

  container.appendChild(item);
}


function addDetailList(
  container,
  label,
  values,
  keyField,
  countField,
  formatter,
) {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return;
  }

  const item =
    document.createElement("div");

  item.className =
    "honeypot-detail-item";

  const header =
    document.createElement("button");

  header.className =
    "honeypot-detail-toggle";

  header.type = "button";

  header.setAttribute(
    "aria-expanded",
    "false",
  );

  const labelElement =
    document.createElement("span");

  labelElement.textContent = label;

  const viewButton =
    document.createElement("span");

  viewButton.className =
    "honeypot-detail-view-button";

  viewButton.textContent =
    "View";

  header.appendChild(labelElement);
  header.appendChild(viewButton);

  const content =
    document.createElement("div");

  content.className =
    "honeypot-detail-content";

  content.hidden = true;

  const table =
    document.createElement("table");

  table.className =
    "dashboard-table honeypot-detail-table";

  table.id = "honeypots-table-container";

  values.slice(0, 10).forEach(
    (entry) => {
      const row =
        document.createElement("tr");

      let value;

      if (formatter) {
        value = formatter(entry);
      } else if (keyField) {
        value = entry[keyField];
      } else {
        value = entry;
      }

      const valueCell =
        document.createElement("td");

      valueCell.textContent =
        value ?? "Unknown";

      const countCell =
        document.createElement("td");

      countCell.textContent =
        countField &&
          typeof entry[countField] === "number"
          ? entry[countField].toLocaleString()
          : "—";

      row.appendChild(valueCell);
      row.appendChild(countCell);

      table.appendChild(row);
    },
  );

  content.appendChild(table);

  header.addEventListener(
    "click",
    () => {
      const expanded =
        header.getAttribute(
          "aria-expanded",
        ) === "true";

      header.setAttribute(
        "aria-expanded",
        String(!expanded),
      );

      content.hidden = expanded;

      viewButton.textContent =
        expanded ? "View" : "Hide";

      viewButton.classList.toggle(
        "is-expanded",
        !expanded,
      );
    },
  );

  item.appendChild(header);
  item.appendChild(content);

  container.appendChild(item);
}

function addASNList(container, label, values) {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return;
  }

  const item =
    document.createElement("div");

  item.className =
    "honeypot-detail-item";

  const header =
    document.createElement("button");

  header.className =
    "honeypot-detail-toggle";

  header.type = "button";

  header.setAttribute(
    "aria-expanded",
    "false",
  );

  const labelElement =
    document.createElement("span");

  labelElement.textContent =
    label;

  const viewButton =
    document.createElement("span");

  viewButton.className =
    "honeypot-detail-view-button";

  viewButton.textContent =
    "View";

  header.appendChild(labelElement);
  header.appendChild(viewButton);

  const content =
    document.createElement("div");

  content.className =
    "honeypot-detail-content";

  content.hidden = true;

  const table =
    document.createElement("table");

  table.className =
    "dashboard-table honeypot-detail-table";

  const headerRow =
    document.createElement("tr");

  ["Organization", "ASN", "Events"].forEach(
    (text) => {
      const th =
        document.createElement("th");

      th.textContent =
        text;

      headerRow.appendChild(th);
    },
  );

  table.appendChild(headerRow);

  values.slice(0, 10).forEach(
    (entry) => {
      const row =
        document.createElement("tr");

      const organization =
        document.createElement("td");

      organization.textContent =
        entry.as_org || "Unknown";

      const asn =
        document.createElement("td");

      asn.textContent = entry.asn
        ? `AS${entry.asn}`
        : "Unknown";

      const events =
        document.createElement("td");

      events.textContent =
        typeof entry.count === "number"
          ? entry.count.toLocaleString()
          : "—";

      row.appendChild(organization);
      row.appendChild(asn);
      row.appendChild(events);

      table.appendChild(row);
    },
  );

  content.appendChild(table);

  header.addEventListener(
    "click",
    () => {
      const expanded =
        header.getAttribute(
          "aria-expanded",
        ) === "true";

      header.setAttribute(
        "aria-expanded",
        String(!expanded),
      );

      content.hidden = expanded;

      viewButton.textContent =
        expanded ? "View" : "Hide";

      viewButton.classList.toggle(
        "is-expanded",
        !expanded,
      );
    },
  );

  item.appendChild(header);
  item.appendChild(content);

  container.appendChild(item);
}