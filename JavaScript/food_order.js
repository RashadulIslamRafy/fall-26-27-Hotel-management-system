
document.addEventListener("DOMContentLoaded", function () {

    var STATUSES = ["Pending", "Preparing", "Delivered"];

    var form = document.querySelector(".order-form-section form");
    var roomInput = document.getElementById("room-number");
    var itemSelect = document.getElementById("food-item");
    var qtyInput = document.getElementById("quantity");
    var submitBtn = form.querySelector(".add-order-btn");

    var searchForm = document.querySelector(".food-order-list .search-filter form");
    var searchInput = searchForm.querySelector('input[name="search"]');
    var statusFilter = document.getElementById("status-filter");
    var tbody = document.querySelector(".food-order-list tbody");

    var editingId = null;     // ID of the order being edited (null = adding a new one)
    var statusGroup = null;   // "Status" dropdown, created only when editing
    var cancelBtn = null;     // "Cancel" button, created only when editing


    function containsText(bigText, query) {
        return String(bigText).toLowerCase().indexOf(query) !== -1;
    }

    function removeAt(list, index) {
        return list.slice(0, index).concat(list.slice(index + 1));
    }

    function findOrderById(id) {
        var orders = DB.get(KEYS.FOOD);
        var i;
        for (i = 0; i < orders.length; i++) {
            if (orders[i].id === id) {
                return orders[i];
            }
        }
        return null;
    }


    /* ---------- Show the table ---------- */

    function render() {

        var query = searchInput.value.trim().toLowerCase();
        var status = statusFilter.value;

        var allOrders = DB.get(KEYS.FOOD);
        var rowsHTML = "";
        var shown = 0;
        var i;

        for (i = 0; i < allOrders.length; i++) {
            var order = allOrders[i];
            var matchesSearch = containsText(order.id, query) || containsText(order.room, query);
            var matchesStatus = (status === "") || (order.status === status);

            if (matchesSearch && matchesStatus) {
                rowsHTML = rowsHTML +
                    "<tr data-id=\"" + escapeHTML(order.id) + "\">" +
                    "<td>" + escapeHTML(order.id) + "</td>" +
                    "<td>" + escapeHTML(order.room) + "</td>" +
                    "<td>" + escapeHTML(order.item) + "</td>" +
                    "<td>" + escapeHTML(order.qty) + "</td>" +
                    "<td>" + escapeHTML(order.time) + "</td>" +
                    "<td><span class=\"status " + statusClass(order.status) + "\">" + escapeHTML(order.status) + "</span></td>" +
                    "<td><button type=\"button\" class=\"edit-btn\">Edit</button></td>" +
                    "<td><button type=\"button\" class=\"delete-btn\">Delete</button></td>" +
                    "</tr>";
                shown = shown + 1;
            }
        }

        if (shown === 0) {
            tbody.innerHTML = "<tr><td colspan=\"8\">No orders found.</td></tr>";
        } else {
            tbody.innerHTML = rowsHTML;
        }
    }


    /* ---------- Edit mode ---------- */

    function enterEditMode(order) {

        editingId = order.id;

        roomInput.value = order.room;
        qtyInput.value = order.qty;

        var hasItem = false;
        var i;
        for (i = 0; i < itemSelect.options.length; i++) {
            if (itemSelect.options[i].value === order.item) {
                hasItem = true;
            }
        }
        if (!hasItem) {
            itemSelect.options[itemSelect.options.length] = new Option(order.item, order.item);
        }
        itemSelect.value = order.item;

        submitBtn.textContent = "Update Order";

        // Status dropdown (only while editing)
        if (!statusGroup) {
            statusGroup = document.createElement("div");
            statusGroup.className = "form-group";

            var optionsHTML = "";
            var s;
            for (s = 0; s < STATUSES.length; s++) {
                optionsHTML = optionsHTML + "<option value=\"" + STATUSES[s] + "\">" + STATUSES[s] + "</option>";
            }

            statusGroup.innerHTML =
                "<label for=\"order-status\">Status</label>" +
                "<select id=\"order-status\" name=\"status\">" + optionsHTML + "</select>";
        }
        statusGroup.querySelector("select").value = order.status;
        submitBtn.parentNode.insertBefore(statusGroup, submitBtn);

        // Cancel button (only while editing)
        if (!cancelBtn) {
            cancelBtn = document.createElement("button");
            cancelBtn.type = "button";
            cancelBtn.className = "delete-btn";
            cancelBtn.textContent = "Cancel";
            cancelBtn.addEventListener("click", exitEditMode);
        }
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);

        form.scrollIntoView({ behavior: "smooth", block: "start" });
        roomInput.focus();
    }

    function exitEditMode() {
        editingId = null;
        form.reset();                       // quantity goes back to 1
        submitBtn.textContent = "Add Order";
        if (statusGroup) {
            statusGroup.parentNode.removeChild(statusGroup);
        }
        if (cancelBtn) {
            cancelBtn.parentNode.removeChild(cancelBtn);
        }
    }


    /* ---------- Add / Update ---------- */

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        var room = roomInput.value.trim();
        var item = itemSelect.value;
        var qty = parseInt(qtyInput.value, 10);

        if (!isValidRoom(room)) {
            showToast("Enter a valid room number, for example 305", "error");
            roomInput.focus();
            return;
        }
        if (!item) {
            showToast("Select a food item", "error");
            itemSelect.focus();
            return;
        }
        if (isNaN(qty) || qty < 1) {
            showToast("Quantity must be 1 or more", "error");
            qtyInput.focus();
            return;
        }

        var orders = DB.get(KEYS.FOOD);

        if (editingId) {

            var order = null;
            var orderIndex = -1;
            var i;

            for (i = 0; i < orders.length; i++) {
                if (orders[i].id === editingId) {
                    order = orders[i];
                    orderIndex = i;
                }
            }

            if (!order) {
                showToast("This order no longer exists", "error");
                exitEditMode();
                render();
                return;
            }

            order.room = room;
            order.item = item;
            order.qty = qty;
            order.status = statusGroup.querySelector("select").value;

            // A tray alert only makes sense for a delivered order
            if (order.status !== "Delivered") {
                order.trayStatus = "";
                order.collectedTime = "";
            }

            orders[orderIndex] = order;

            showToast("Order " + order.id + " updated");

        } else {

            var newOrder = {
                id: DB.nextId("FO", orders),
                room: room,
                item: item,
                qty: qty,
                status: "Pending",
                trayStatus: "",
                collectedTime: "",
                time: formatNow(),
                createdAt: Date.now()
            };

            orders.push(newOrder);
            showToast("Order " + newOrder.id + " added");
        }

        DB.set(KEYS.FOOD, orders);
        exitEditMode();
        render();
    });


    /* ---------- Edit / Delete buttons inside the table ---------- */

    tbody.addEventListener("click", function (event) {

        var target = event.target;
        if (target.tagName !== "BUTTON") {
            return;
        }

        var row = target.parentNode.parentNode;
        var id = row.getAttribute("data-id");

        if (target.className.indexOf("edit-btn") !== -1) {
            var order = findOrderById(id);
            if (order) {
                enterEditMode(order);
            }
        }

        if (target.className.indexOf("delete-btn") !== -1) {
            if (!confirm("Delete order " + id + "?")) {
                return;
            }

            var orders = DB.get(KEYS.FOOD);
            var indexToDelete = -1;
            var i;

            for (i = 0; i < orders.length; i++) {
                if (orders[i].id === id) {
                    indexToDelete = i;
                }
            }
            if (indexToDelete !== -1) {
                DB.set(KEYS.FOOD, removeAt(orders, indexToDelete));
            }

            if (editingId === id) {
                exitEditMode();
            }

            showToast("Order " + id + " deleted");
            render();
        }
    });


    /* ---------- Search and filter ---------- */

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        render();
    });
    searchInput.addEventListener("keyup", render);
    statusFilter.addEventListener("change", render);

    // If another page changes the data, refresh the table
    window.addEventListener("storage", render);

    render();
});
