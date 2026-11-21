document.addEventListener("DOMContentLoaded", function () {

    // Find Logout link from Sidebar
    const logoutLink = document.querySelector('a[href="logout.html"]');

    if (logoutLink) {

        logoutLink.addEventListener("click", function (event) {

            // Stop opening logout.html
            event.preventDefault();

            // Ask for confirmation
            const confirmLogout = confirm(
                "Are you sure you want to logout?"
            );

            if (confirmLogout) {

                // Show successful logout message
                alert("Logout Successful! Thank you for using Hotel Management System.");

            }

        });

    }

});