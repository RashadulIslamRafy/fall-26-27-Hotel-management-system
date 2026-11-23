
document.addEventListener("DOMContentLoaded", function () {

    var alertBody = document.querySelector(".tray-alert-section tbody");
    var historyBody = document.querySelector(".tray-history-section tbody");


    /* ---------- Show both tables ---------- */

    function render() {

        var allOrders = DB.get(KEYS.FOOD);
        var alertsHTML = "";
        var alertCount = 0;
        var historyList = [];
        var i;

        for (i = 0; i < allOrders.length; i++) {
            var order = allOrders[i];

            if (order.trayStatus === "Eating Finished") {
                alertsHTML = alertsHTML +
                    "<tr data-id=\"" + escapeHTML(order.id) + "\">" +
                    "<td>" + escapeHTML(order.id) + "</td>" +
                    "<td>" + escapeHTML(order.room) + "</td>" +
                    "<td>" + escapeHTML(order.item) + "</td>" +
                    "<td>" + escapeHTML(timeOnly(order.time)) + "</td>" +
                    "<td><span class=\"status eating-finished\">Eating Finished</span></td>" +
                    "<td><button type=\"button\" class=\"collect-btn\">Collect Tray</button></td>" +
                    "</tr>";
                alertCount = alertCount + 1;
            }

            if (order.trayStatus === "Tray Collected") {
                historyList.push(order);
            }
        }

        // Sort history by collected time, latest first (simple bubble sort, no .sort())
        var a;
        var b;
        for (a = 0; a < historyList.length; a++) {
            for (b = 0; b < historyList.length - 1 - a; b++) {
                var timeA = parseTime(historyList[b].collectedTime);
                var timeB = parseTime(historyList[b + 1].collectedTime);
                if (timeA < timeB) {
                    var temp = historyList[b];
                    historyList[b] = historyList[b + 1];
                    historyList[b + 1] = temp;
                }
            }
        }

        /* Alerts */
        if (alertCount === 0) {
            alertBody.innerHTML = "<tr><td colspan=\"6\">No trays waiting for collection.</td></tr>";
        } else {
            alertBody.innerHTML = alertsHTML;
        }

        /* History */
        var historyHTML = "";
        var h;
        for (h = 0; h < historyList.length; h++) {
            var historyOrder = historyList[h];
            historyHTML = historyHTML +
                "<tr>" +
                "<td>" + escapeHTML(historyOrder.id) + "</td>" +
                "<td>" + escapeHTML(historyOrder.room) + "</td>" +
                "<td>" + escapeHTML(historyOrder.item) + "</td>" +
                "<td>" + escapeHTML(timeOnly(historyOrder.collectedTime)) + "</td>" +
                "<td><span class=\"status tray-collected\">Tray Collected</span></td>" +
                "</tr>";
        }

        if (historyList.length === 0) {
            historyBody.innerHTML = "<tr><td colspan=\"5\">No trays collected yet.</td></tr>";
        } else {
            historyBody.innerHTML = historyHTML;
        }
    }


    /* ---------- Collect Tray button ---------- */

    alertBody.addEventListener("click", function (event) {

        var target = event.target;
        if (target.className.indexOf("collect-btn") === -1) {
            return;
        }

        var row = target.parentNode.parentNode;
        var id = row.getAttribute("data-id");

        var orders = DB.get(KEYS.FOOD);
        var order = null;
        var i;

        for (i = 0; i < orders.length; i++) {
            if (orders[i].id === id) {
                order = orders[i];
            }
        }

        if (!order) {
            showToast("This order no longer exists", "error");
            render();
            return;
        }

        order.trayStatus = "Tray Collected";
        order.collectedTime = formatNow();
        DB.set(KEYS.FOOD, orders);

        showToast("Tray collected from room " + order.room);
        render();
    });

    // New alerts from the customer page show up without a refresh
    window.addEventListener("storage", render);

    render();
});
