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
});
