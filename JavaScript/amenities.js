
document.addEventListener("DOMContentLoaded", function () {

    // To add a new item, add it here. Dropdown and list both update.
    var AVAILABLE_ITEMS = ["Extra Towel", "Water Bottle", "Soap", "Toiletries Kit", "Pillow"];

    var form = document.querySelector(".add-amenities-card form");
    var roomInput = document.getElementById("room-number");
    var itemSelect = document.getElementById("item-name");
    var availableList = document.querySelector(".available-items-list");

    var searchForm = document.querySelector(".amenities-request-list .search-section form");
    var searchInput = searchForm.querySelector('input[name="search"]');
    var tbody = document.querySelector(".amenities-request-list tbody");


    /* ---------- Fill the dropdown and the Available Items list ---------- */

    var optionsHTML = "<option value=\"\">Select Item</option>";
    var listHTML = "";
    var i;

    for (i = 0; i < AVAILABLE_ITEMS.length; i++) {
        optionsHTML = optionsHTML + "<option value=\"" + AVAILABLE_ITEMS[i] + "\">" + AVAILABLE_ITEMS[i] + "</option>";
        listHTML = listHTML + "<li>&#10004; " + AVAILABLE_ITEMS[i] + "</li>";
    }

    itemSelect.innerHTML = optionsHTML;
    availableList.innerHTML = listHTML;


    /* ---------- Helper: does this text contain the search text? ---------- */

    function containsText(bigText, query) {
        return String(bigText).toLowerCase().indexOf(query) !== -1;
    }

    /* ---------- Helper: remove one item from an array by its position ---------- */

    function removeAt(list, index) {
        return list.slice(0, index).concat(list.slice(index + 1));
    }


    /* ---------- Show the table ---------- */

    function render() {

        var query = searchInput.value.trim().toLowerCase();
        var allRequests = DB.get(KEYS.AMENITIES);
        var rowsHTML = "";
        var shown = 0;
        var r;

        for (r = 0; r < allRequests.length; r++) {
            var request = allRequests[r];

            if (containsText(request.room, query)) {
                rowsHTML = rowsHTML +
                    "<tr data-id=\"" + escapeHTML(request.id) + "\">" +
                    "<td>" + escapeHTML(request.id) + "</td>" +
                    "<td>" + escapeHTML(request.room) + "</td>" +
                    "<td>" + escapeHTML(request.item) + "</td>" +
                    "<td>" + escapeHTML(request.time) + "</td>" +
                    "<td><button type=\"button\" class=\"delete-btn\">Delete</button></td>" +
                    "</tr>";
                shown = shown + 1;
            }
        }

        if (shown === 0) {
            tbody.innerHTML = "<tr><td colspan=\"5\">No requests found.</td></tr>";
        } else {
            tbody.innerHTML = rowsHTML;
        }
    }


    /* ---------- Add a request ---------- */

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        var room = roomInput.value.trim();
        var item = itemSelect.value;

        if (!isValidRoom(room)) {
            showToast("Enter a valid room number, for example 305", "error");
            roomInput.focus();
            return;
        }
        if (!item) {
            showToast("Select an item", "error");
            itemSelect.focus();
            return;
        }

        var requests = DB.get(KEYS.AMENITIES);

        var newRequest = {
            id: DB.nextId("AR", requests),
            room: room,
            item: item,
            time: formatNow(),
            createdAt: Date.now()
        };

        requests.push(newRequest);
        DB.set(KEYS.AMENITIES, requests);

        form.reset();
        showToast("Request " + newRequest.id + " added");
        render();
    });


    /* ---------- Delete button inside the table ---------- */

    tbody.addEventListener("click", function (event) {

        var target = event.target;
        if (target.className.indexOf("delete-btn") === -1) {
            return;
        }

        var row = target.parentNode.parentNode;
        var id = row.getAttribute("data-id");

        if (!confirm("Delete request " + id + "?")) {
            return;
        }

        var requests = DB.get(KEYS.AMENITIES);
        var indexToDelete = -1;
        var i;

        for (i = 0; i < requests.length; i++) {
            if (requests[i].id === id) {
                indexToDelete = i;
            }
        }

        if (indexToDelete !== -1) {
            DB.set(KEYS.AMENITIES, removeAt(requests, indexToDelete));
        }

        showToast("Request " + id + " deleted");
        render();
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
