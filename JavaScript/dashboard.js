
document.addEventListener("DOMContentLoaded", function () {

    var counters = document.querySelectorAll(".summary-card h2");
    var activityList = document.querySelector(".activity-list");

    function render() {

        var orders = DB.get(KEYS.FOOD);
        var issues = DB.get(KEYS.ISSUES);
        var amenities = DB.get(KEYS.AMENITIES);
        var i;

        var trayAlertCount = 0;
        for (i = 0; i < orders.length; i++) {
            if (orders[i].trayStatus === "Eating Finished") {
                trayAlertCount = trayAlertCount + 1;
            }
        }

        /* Summary cards: Orders, Issues, Tray Alerts, Amenities (same order as the HTML) */
        var totals = [orders.length, issues.length, trayAlertCount, amenities.length];

        var c;
        for (c = 0; c < counters.length; c++) {
            if (totals[c] !== undefined) {
                counters[c].textContent = totals[c];
            }
        }

        /* Recent activities: build one combined list from all three sources */
        var activities = [];

        for (i = 0; i < orders.length; i++) {
            var order = orders[i];
            var orderStamp = order.createdAt;
            if (!orderStamp) {
                orderStamp = parseTime(order.time);
            }
            activities.push({
                icon: "🍗",
                room: order.room,
                text: "Food order placed (" + order.item + ")",
                time: order.time,
                stamp: orderStamp
            });
        }

        for (i = 0; i < issues.length; i++) {
            var issue = issues[i];
            var issueStamp = issue.createdAt;
            if (!issueStamp) {
                issueStamp = parseTime(issue.time);
            }
            activities.push({
                icon: "🔧",
                room: issue.room,
                text: "Issue reported (" + issue.description + ")",
                time: issue.time,
                stamp: issueStamp
            });
        }

        for (i = 0; i < amenities.length; i++) {
            var request = amenities[i];
            var requestStamp = request.createdAt;
            if (!requestStamp) {
                requestStamp = parseTime(request.time);
            }
            activities.push({
                icon: "🧳",
                room: request.room,
                text: "Amenities requested (" + request.item + ")",
                time: request.time,
                stamp: requestStamp
            });
        }

        /* Sort newest first (simple bubble sort, no .sort()) */
        var x;
        var y;
        for (x = 0; x < activities.length; x++) {
            for (y = 0; y < activities.length - 1 - x; y++) {
                if (activities[y].stamp < activities[y + 1].stamp) {
                    var temp = activities[y];
                    activities[y] = activities[y + 1];
                    activities[y + 1] = temp;
                }
            }
        }

        /* Keep only the newest 5 */
        var topActivities = activities.slice(0, 5);

        if (topActivities.length === 0) {
            activityList.innerHTML =
                "<div class=\"activity-item\">" +
                "<span class=\"activity-description\">No activity yet. New orders, issues and requests will show up here.</span>" +
                "</div>";
            return;
        }

        var activitiesHTML = "";
        var t;
        for (t = 0; t < topActivities.length; t++) {
            var activity = topActivities[t];
            activitiesHTML = activitiesHTML +
                "<div class=\"activity-item\">" +
                "<span class=\"activity-icon\">" + activity.icon + "</span>" +
                "<span class=\"room-number\">Room " + escapeHTML(activity.room) + "</span>" +
                "<span class=\"activity-description\">- " + escapeHTML(activity.text) + "</span>" +
                "<span class=\"activity-time\">" + escapeHTML(friendlyTime(activity.time)) + "</span>" +
                "</div>";
        }
        activityList.innerHTML = activitiesHTML;
    }

    render();

    // If another page changes the data, refresh the numbers
    window.addEventListener("storage", render);
});
