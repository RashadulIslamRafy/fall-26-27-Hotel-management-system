
var REQUIRE_LOGIN = false;


/* ---------- Toast message (small popup, bottom-right) ---------- */

(function addToastStyles() {
    var style = document.createElement("style");
    style.textContent =
        "#toast {" +
        "position: fixed;" +
        "right: 24px;" +
        "bottom: 24px;" +
        "z-index: 9999;" +
        "padding: 12px 18px;" +
        "border-radius: 8px;" +
        "color: #fff;" +
        "font-size: 13px;" +
        "font-weight: 700;" +
        "box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);" +
        "opacity: 0;" +
        "transform: translateY(12px);" +
        "transition: opacity 0.25s ease, transform 0.25s ease;" +
        "pointer-events: none;" +
        "}" +
        "#toast.show { opacity: 1; transform: none; }" +
        "#toast.success { background: #19a34a; }" +
        "#toast.error { background: #d62835; }" +
        "#toast.info { background: #0875dc; }";
    document.head.appendChild(style);
})();


/* ---------- Auto Tray Collection (10 minutes after the order was placed) ---------- */

function checkAutoTrayCollection() {
    var orders = DB.get(KEYS.FOOD);
    var now = Date.now();
    var TEN_MINUTES = 10 * 60 * 1000;
    var changed = false;
    var i;

    for (i = 0; i < orders.length; i++) {
        var order = orders[i];
        var placedAt = order.createdAt;
        if (!placedAt) {
            placedAt = parseTime(order.time);
        }

        if (!order.trayStatus && placedAt && (now - placedAt >= TEN_MINUTES)) {
            order.trayStatus = "Eating Finished";
            changed = true;
        }
    }

    if (changed) {
        DB.set(KEYS.FOOD, orders);
        window.dispatchEvent(new Event("storage")); // tells every page the data changed
    }
}


// showToast("Order added", "success")   types: success | error | info
function showToast(message, type) {
    if (type === undefined) {
        type = "success";
    }

    var toast = document.getElementById("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = type + " show";

    clearTimeout(toast.hideTimer);
    toast.hideTimer = setTimeout(function () {
        toast.className = type;
    }, 2500);
}


/* ---------- Login check, profile name, logout ---------- */

document.addEventListener("DOMContentLoaded", function () {

    checkAutoTrayCollection();                      // check once as soon as the page loads
    setInterval(checkAutoTrayCollection, 15000);     // then keep checking every 15 seconds

    var user = memoryStore[KEYS.USER];
    if (user === undefined) {
        user = null;
    }

    // Not logged in -> back to the login page
    if (REQUIRE_LOGIN && !user) {
        window.location.href = "login.html";
        return;
    }

    // Show the logged-in name in the top-right profile box
    var nameBox = document.querySelector(".profile span:nth-child(2)");
    if (user && user.name && nameBox) {
        nameBox.textContent = user.name;
    }

    // Logout link: clear the session, then let the link go to login.html
    var logoutLink = document.querySelector('.sidebar-menu a[href="login.html"]');
    if (logoutLink) {
        logoutLink.addEventListener("click", function () {
            delete memoryStore[KEYS.USER];
        });
    }
});
