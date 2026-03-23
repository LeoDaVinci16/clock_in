function loadData() {
    return JSON.parse(localStorage.getItem("work_log") || "[]");
}

function saveData(data) {
    localStorage.setItem("work_log", JSON.stringify(data));
}

// Local date (IMPORTANT: avoids UTC bug)
function getToday() {
    let d = new Date();
    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}

function getTime() {
    return new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Update UI
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

// Main button logic
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

// Manual override (EDIT)
function manualCheck() {
    let input = document.getElementById("manualTime").value;

    if (!input) {
        alert("Select a date and time");
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
        // create new entry
        data.push({ date: date, check_in: time, check_out: "" });
    } else {
        // overwrite intelligently
        if (!entry.check_in) {
            entry.check_in = time;
        } else if (!entry.check_out) {
            entry.check_out = time;
        } else {
            // if both exist → overwrite check_out
            entry.check_out = time;
        }
    }

    saveData(data);
    updateUI();
}

// History display
function renderHistory() {
    let data = loadData();

    let text = data.map(e =>
        `${e.date}   IN ${e.check_in}   OUT ${e.check_out}`
    ).join("\n");

    document.getElementById("history").innerText = text;
}

// Weekly summary
function getWeeklySummary() {
    let data = loadData();

    return data.map(e =>
        `${e.date}  IN ${e.check_in}  OUT ${e.check_out}`
    ).join("\n");
}

// Copy to clipboard
function copySummary() {
    navigator.clipboard.writeText(getWeeklySummary());
    alert("Copied!");
}

// Email
function sendEmail() {
    let body = encodeURIComponent(getWeeklySummary());
    window.location.href = `mailto:?subject=Work hours&body=${body}`;
}

// Init
updateUI();