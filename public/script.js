document.addEventListener('DOMContentLoaded', function() {
    // Fetch menu items from JSON file
    fetch('menu.json')
        .then(response => response.json())
        .then(data => {
            // Generate HTML for menu items
            const menuContainer = document.querySelector('.menu .menu-items');
            data.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.classList.add('menu-item');
                menuItem.innerHTML = `
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <span>${item.price}</span>
                `;
                menuContainer.appendChild(menuItem);
            });
        })
        .catch(error => {
            console.error('Error fetching menu items:', error);
        });

    // Show button when user scrolls down 20px from the top of the document
    window.onscroll = function() {scrollFunction()};

    function scrollFunction() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            document.getElementById("backToTopBtn").style.display = "block";
        } else {
            document.getElementById("backToTopBtn").style.display = "none";
        }
    }

    // Scroll to the top of the document when the button is clicked
    document.getElementById("backToTopBtn").addEventListener("click", function() {
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    });

});

