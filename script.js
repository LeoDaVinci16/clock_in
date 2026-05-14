function loadData() {
    return JSON.parse(localStorage.getItem("work_log") || "[]");
}

function saveData(data) {
    localStorage.setItem("work_log", JSON.stringify(data));
}

// Local date
function getToday() {
    let d = new Date();
    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}

function getTime() {
    return new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// UI update
function updateUI() {
    let data = loadData();
    let today = getToday();
    let entry = data.find(e => e.date === today);

    let btn = document.getElementById("mainBtn");
    let status = document.getElementById("status");

    if (!entry) {
        btn.innerText = "CHECK IN";
        btn.classList.remove("out");
        status.innerText = "Not checked in";
    } else if (!entry.check_out) {
        btn.innerText = "CHECK OUT";
        btn.classList.add("out");
        status.innerText = "Checked in at " + entry.check_in;
    } else {
        btn.innerText = "DONE";
        btn.classList.add("out");
        status.innerText = `IN ${entry.check_in} / OUT ${entry.check_out}`;
    }

    renderHistory();
}

// Main button
function checkAction() {
    let data = loadData();
    let today = getToday();
    let now = getTime();

    let entry = data.find(e => e.date === today);

    if (!entry) {
        data.push({ date: today, check_in: now, check_out: "" });
    } else if (!entry.check_out) {
        entry.check_out = now;
    }

    saveData(data);
    updateUI();
}

// Manual edit
function manualCheck() {
    let input = document.getElementById("manualTime").value;

    if (!input) {
        alert("Select date & time");
        return;
    }

    let d = new Date(input);

    let date = d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");

    let time = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    let data = loadData();
    let entry = data.find(e => e.date === date);

    if (!entry) {
        data.push({ date: date, check_in: time, check_out: "" });
    } else {
        if (!entry.check_in) {
            entry.check_in = time;
        } else {
            entry.check_out = time;
        }
    }

    saveData(data);
    updateUI();
}

// Helper to calculate duration between two HH:MM time strings
function calculateDuration(checkInTime, checkOutTime) {
    if (!checkInTime || !checkOutTime) {
        return "";
    }

    // Parse HH:MM strings into total minutes from midnight
    const parseTime = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const inMinutes = parseTime(checkInTime);
    const outMinutes = parseTime(checkOutTime);

    let diffMinutes = outMinutes - inMinutes;

    // If check_out is earlier than check_in, it's an invalid entry for same-day calculation
    if (diffMinutes < 0) {
        return "Invalid";
    }

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    let durationString = "";
    if (hours > 0) durationString += `${hours}h `;
    durationString += `${minutes}m`; // Always show minutes, even if 0
    return durationString.trim();
}

// Render history with editable fields
function renderHistory() {
    let data = loadData();
    let container = document.getElementById("history");

    container.innerHTML = "";

    data.forEach((e, index) => {
        let row = document.createElement("div");
        row.className = "row";

        let duration = calculateDuration(e.check_in, e.check_out);
        let durationDisplay = duration ? `<span class="duration">${duration}</span>` : `<span class="duration">-</span>`;

        row.innerHTML = `
            <span class="date">${e.date}</span>

            <span class="time editable" data-index="${index}" data-field="check_in">
                ${e.check_in || "-"}
            </span>

            <span class="time editable" data-index="${index}" data-field="check_out">
                ${e.check_out || "-"}
            </span>
            ${durationDisplay}
        `;

        container.appendChild(row);
    });

    enableEditing();
}

// Enable click-to-edit
function enableEditing() {
    document.querySelectorAll(".editable").forEach(el => {
        el.onclick = function () {
            let index = this.dataset.index;
            let field = this.dataset.field;

            let currentValue = this.innerText;

            let input = document.createElement("input");
            input.type = "time";
            input.value = currentValue !== "-" ? currentValue : "";

            this.innerHTML = "";
            this.appendChild(input);
            input.focus();

            input.onblur = () => saveEdit(index, field, input.value);
            input.onkeydown = (e) => {
                if (e.key === "Enter") {
                    saveEdit(index, field, input.value);
                }
            };
        };
    });
}

// Save inline edit
function saveEdit(index, field, value) {
    let data = loadData();

    if (value) {
        data[index][field] = value;
    }

    saveData(data);
    updateUI();
}

// Copy summary
function getSummary() {
    let data = loadData();
    return data.map(e => {
        const duration = calculateDuration(e.check_in, e.check_out);
        return `${e.date} IN ${e.check_in || '-'} OUT ${e.check_out || '-'} ${duration ? `(${duration})` : ''}`;
    }).join("\n");
}

function copySummary() {
    navigator.clipboard.writeText(getSummary());
    alert("Copied!");
}

function sendEmail() {
    let body = encodeURIComponent(getSummary());
    window.location.href = `mailto:?subject=Work hours&body=${body}`;
}

// Init
updateUI();