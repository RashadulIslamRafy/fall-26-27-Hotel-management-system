
var KEYS = {
    FOOD: "foodOrders",
    ISSUES: "roomIssues",
    AMENITIES: "amenityRequests",
    USER: "currentUser"            // { name: "...", role: "..." }
};

var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


/* ---------- Data lives only in memory (no database, no localStorage) ---------- */
var memoryStore = {};


/* ---------- Tiny database helper ---------- */
var DB = {

    // Read a list (returns [] if nothing saved yet)
    get: function (key) {
        if (memoryStore[key] === undefined) {
            return [];
        }
        return memoryStore[key];
    },

    // Save a list
    set: function (key, data) {
        memoryStore[key] = data;
    },

    // Next ID like FO004, IR004, AR004
    nextId: function (prefix, list) {
        var highest = 0;
        var i;

        for (i = 0; i < list.length; i++) {
            var idText = String(list[i].id);
            var digits = "";
            var c;

            for (c = 0; c < idText.length; c++) {
                var ch = idText.charAt(c);
                if (ch >= "0" && ch <= "9") {
                    digits = digits + ch;
                }
            }

            var num = parseInt(digits, 10);
            if (isNaN(num)) {
                num = 0;
            }
            if (num > highest) {
                highest = num;
            }
        }

        var nextNumber = highest + 1;
        var nextText = String(nextNumber);
        while (nextText.length < 3) {
            nextText = "0" + nextText;
        }

        return prefix + nextText;
    },

    // Save demo data only the very first time (nothing in memory yet)
    init: function (key, seed) {
        if (memoryStore[key] === undefined) {
            DB.set(key, seed);
        }
    },

    // Type DB.reset() in the browser console to get the demo data back
    reset: function () {
        delete memoryStore[KEYS.FOOD];
        delete memoryStore[KEYS.ISSUES];
        delete memoryStore[KEYS.AMENITIES];
        location.reload();
    }
};


/* ---------- Helper functions ---------- */

function pad(n) {
    var text = String(n);
    if (text.length < 2) {
        text = "0" + text;
    }
    return text;
}

// Current time as  "2026-11-07 10:30 AM"
function formatNow() {
    var d = new Date();
    var hours = d.getHours();
    var ampm = "AM";

    if (hours >= 12) {
        ampm = "PM";
    }
    hours = hours % 12;
    if (hours === 0) {
        hours = 12;
    }

    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
        " " + pad(hours) + ":" + pad(d.getMinutes()) + " " + ampm;
}

// "2026-11-07 10:30 AM"  ->  timestamp (number). Returns 0 if it can't be read.
function parseTime(str) {
    if (!str) {
        return 0;
    }

    var parts = str.split(" ");
    if (parts.length < 3) {
        return 0;
    }

    var dateParts = parts[0].split("-");
    var timeParts = parts[1].split(":");
    var ampm = parts[2];

    var year = parseInt(dateParts[0], 10);
    var month = parseInt(dateParts[1], 10) - 1;
    var day = parseInt(dateParts[2], 10);
    var hours = parseInt(timeParts[0], 10) % 12;
    var minutes = parseInt(timeParts[1], 10);

    if (ampm.toUpperCase() === "PM") {
        hours = hours + 12;
    }

    var d = new Date(year, month, day, hours, minutes);
    return d.getTime();
}

// "2026-11-07 10:30 AM"  ->  "10:30 AM"
function timeOnly(str) {
    if (!str) {
        return "";
    }
    var parts = str.split(" ");
    if (parts.length < 3) {
        return str;
    }
    return parts[1] + " " + parts[2];
}

// Today -> "10:30 AM", other days -> "07 Nov, 10:30 AM"
function friendlyTime(str) {
    var ts = parseTime(str);
    if (!ts) {
        if (str) {
            return str;
        }
        return "";
    }

    var d = new Date(ts);
    var today = new Date();

    if (d.toDateString() === today.toDateString()) {
        return timeOnly(str);
    }
    return pad(d.getDate()) + " " + MONTHS[d.getMonth()] + ", " + timeOnly(str);
}

// Stops user text from being run as HTML (use it whenever you build rows with innerHTML)
function escapeHTML(value) {
    var text = String(value);
    var result = "";
    var i;

    for (i = 0; i < text.length; i++) {
        var ch = text.charAt(i);

        if (ch === "&") {
            result = result + "&amp;";
        } else if (ch === "<") {
            result = result + "&lt;";
        } else if (ch === ">") {
            result = result + "&gt;";
        } else if (ch === "\"") {
            result = result + "&quot;";
        } else if (ch === "'") {
            result = result + "&#39;";
        } else {
            result = result + ch;
        }
    }

    return result;
}

// "Eating Finished" -> "eating-finished" (matches the CSS .status classes)
function statusClass(status) {
    var text = String(status).toLowerCase();
    var result = "";
    var i;

    for (i = 0; i < text.length; i++) {
        if (text.charAt(i) === " ") {
            result = result + "-";
        } else {
            result = result + text.charAt(i);
        }
    }

    return result;
}

// Room numbers like 305, 12, A101 (letters, digits, hyphen, 1-6 characters)
function isValidRoom(value) {
    if (!value) {
        return false;
    }
    if (value.length < 1 || value.length > 6) {
        return false;
    }

    var i;
    for (i = 0; i < value.length; i++) {
        var ch = value.charAt(i);
        var isLetter = (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z");
        var isDigit = ch >= "0" && ch <= "9";
        var isDash = ch === "-";

        if (!isLetter && !isDigit && !isDash) {
            return false;
        }
    }

    return true;
}


/* ---------- Demo data (copied from your HTML pages) ---------- */

function foodOrder(id, room, item, qty, status, time, trayStatus, collectedTime) {
    if (trayStatus === undefined) {
        trayStatus = "";
    }
    if (collectedTime === undefined) {
        collectedTime = "";
    }

    return {
        id: id,
        room: room,
        item: item,
        qty: qty,
        status: status,
        time: time,
        trayStatus: trayStatus,
        collectedTime: collectedTime,
        createdAt: parseTime(time)
    };
}

function simpleRow(fields) {
    fields.createdAt = parseTime(fields.time);
    return fields;
}

DB.init(KEYS.FOOD, [
    foodOrder("FO001", "305", "Chicken Burger", 2, "Pending",   "2026-11-07 10:30 AM"),
    foodOrder("FO002", "302", "Fried Rice",     1, "Preparing", "2026-11-07 09:15 AM"),
    foodOrder("FO003", "308", "Pasta",          2, "Delivered", "2026-11-06 08:20 PM"),

    // Tray alerts (customer finished eating)
    foodOrder("FO101", "305", "Chicken Burger", 1, "Delivered", "2026-11-07 10:00 AM", "Eating Finished"),
    foodOrder("FO102", "308", "Fried Rice",     1, "Delivered", "2026-11-07 10:15 AM", "Eating Finished"),

    // Tray collection history
    foodOrder("FO098", "302", "Pasta",    1, "Delivered", "2026-11-07 10:30 AM", "Tray Collected", "2026-11-07 11:05 AM"),
    foodOrder("FO099", "307", "Soup",     1, "Delivered", "2026-11-07 10:40 AM", "Tray Collected", "2026-11-07 11:10 AM"),
    foodOrder("FO100", "305", "Sandwich", 1, "Delivered", "2026-11-07 10:45 AM", "Tray Collected", "2026-11-07 11:20 AM")
]);

DB.init(KEYS.ISSUES, [
    simpleRow({ id: "IR001", room: "305", description: "AC not working",    status: "Solved",     time: "2026-11-07 08:45 AM" }),
    simpleRow({ id: "IR002", room: "308", description: "TV not working",    status: "Processing", time: "2026-11-07 09:30 AM" }),
    simpleRow({ id: "IR003", room: "301", description: "Water supply issue", status: "Solved",    time: "2026-11-06 07:50 PM" })
]);

DB.init(KEYS.AMENITIES, [
    simpleRow({ id: "AR001", room: "305", item: "Extra Towel",  time: "2026-11-07 09:10 AM" }),
    simpleRow({ id: "AR002", room: "301", item: "Water Bottle", time: "2026-11-07 09:20 AM" }),
    simpleRow({ id: "AR003", room: "308", item: "Soap",         time: "2026-11-07 10:05 AM" })
]);
