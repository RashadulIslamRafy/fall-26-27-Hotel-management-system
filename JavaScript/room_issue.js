
document.addEventListener("DOMContentLoaded", function () {

    var STATUSES = ["Pending", "Processing", "Solved"];

    var form = document.querySelector(".report-form-card form");
    var roomInput = document.getElementById("room-number");
    var descInput = document.getElementById("problem-description");

    var searchForm = document.querySelector(".issue-report-list .search-section form");
    var searchInput = searchForm.querySelector('input[name="search"]');
    var tbody = document.querySelector(".issue-report-list tbody");


    function containsText(bigText, query) {
        return String(bigText).toLowerCase().indexOf(query) !== -1;
    }

    function removeAt(list, index) {
        return list.slice(0, index).concat(list.slice(index + 1));
    }


    /* ---------- Show the table ---------- */

    function render() {

        var query = searchInput.value.trim().toLowerCase();
        var allIssues = DB.get(KEYS.ISSUES);
        var rowsHTML = "";
        var shown = 0;
        var i;

        for (i = 0; i < allIssues.length; i++) {
            var issue = allIssues[i];

            if (containsText(issue.room, query)) {

                var optionsHTML = "";
                var s;
                for (s = 0; s < STATUSES.length; s++) {
                    var selectedText = "";
                    if (STATUSES[s] === issue.status) {
                        selectedText = " selected";
                    }
                    optionsHTML = optionsHTML + "<option value=\"" + STATUSES[s] + "\"" + selectedText + ">" + STATUSES[s] + "</option>";
                }

                rowsHTML = rowsHTML +
                    "<tr data-id=\"" + escapeHTML(issue.id) + "\">" +
                    "<td>" + escapeHTML(issue.id) + "</td>" +
                    "<td>" + escapeHTML(issue.room) + "</td>" +
                    "<td>" + escapeHTML(issue.description) + "</td>" +
                    "<td><select>" + optionsHTML + "</select></td>" +
                    "<td><button type=\"button\" class=\"update-btn\">Update</button></td>" +
                    "<td><button type=\"button\" class=\"delete-btn\">Delete</button></td>" +
                    "</tr>";
                shown = shown + 1;
            }
        }

        if (shown === 0) {
            tbody.innerHTML = "<tr><td colspan=\"6\">No issues found.</td></tr>";
        } else {
            tbody.innerHTML = rowsHTML;
        }
    }


    /* ---------- Report a new issue ---------- */

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        var room = roomInput.value.trim();
        var description = descInput.value.trim();

        if (!isValidRoom(room)) {
            showToast("Enter a valid room number, for example 305", "error");
            roomInput.focus();
            return;
        }
        if (description.length < 3) {
            showToast("Describe the problem in a few words", "error");
            descInput.focus();
            return;
        }

        var issues = DB.get(KEYS.ISSUES);

        var newIssue = {
            id: DB.nextId("IR", issues),
            room: room,
            description: description,
            status: "Pending",
            time: formatNow(),
            createdAt: Date.now()
        };

        issues.push(newIssue);
        DB.set(KEYS.ISSUES, issues);

        form.reset();
        showToast("Issue " + newIssue.id + " reported");
        render();
    });


    /* ---------- Update / Delete buttons inside the table ---------- */

    tbody.addEventListener("click", function (event) {

        var target = event.target;
        if (target.tagName !== "BUTTON") {
            return;
        }

        var row = target.parentNode.parentNode;
        var id = row.getAttribute("data-id");

        if (target.className.indexOf("update-btn") !== -1) {

            var issues = DB.get(KEYS.ISSUES);
            var issue = null;
            var i;

            for (i = 0; i < issues.length; i++) {
                if (issues[i].id === id) {
                    issue = issues[i];
                }
            }

            if (!issue) {
                showToast("This issue no longer exists", "error");
                render();
                return;
            }

            issue.status = row.querySelector("select").value;
            DB.set(KEYS.ISSUES, issues);

            showToast("Issue " + id + " set to " + issue.status);
        }

        if (target.className.indexOf("delete-btn") !== -1) {
            if (!confirm("Delete issue " + id + "?")) {
                return;
            }

            var issuesAll = DB.get(KEYS.ISSUES);
            var indexToDelete = -1;
            var j;

            for (j = 0; j < issuesAll.length; j++) {
                if (issuesAll[j].id === id) {
                    indexToDelete = j;
                }
            }
            if (indexToDelete !== -1) {
                DB.set(KEYS.ISSUES, removeAt(issuesAll, indexToDelete));
            }

            showToast("Issue " + id + " deleted");
            render();
        }
    });


    /* ---------- Search ---------- */

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        render();
    });
    searchInput.addEventListener("keyup", render);

    // If another page changes the data, refresh the table
    window.addEventListener("storage", render);

    render();
});
