document.addEventListener('DOMContentLoaded', function() {
    const userDataElement = document.getElementById('user-data');
    const userId = userDataElement.dataset.userId;

    async function createCartItem(itemId, quantity) {
        try {
            const response = await fetch('/api/cartItems', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ itemId, quantity })
            });
            if (!response.ok) {
                throw new Error('Failed to create cart item');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating cart item:', error);
            throw error;
        }
    }

    async function updateCartItem(itemId, quantity) {
        try {
            const response = await fetch(`/api/cartItems/${userId, itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity })
            });
            if (!response.ok) {
                throw new Error('Failed to update cart item');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating cart item:', error);
            throw error;
        }
    }

    async function deleteCartItem(itemId) {
        try {
            const response = await fetch(`/api/cartItems/${itemId}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete cart item');
            }
        } catch (error) {
            console.error('Error deleting cart item:', error);
            throw error;
        }
    }
    
    // Function to fetch cart items from the server
    function fetchCartItems() {
        // Make a GET request to fetch cart items
        fetch('/api/cartItems')
            .then(response => response.json())
            .then(data => {
                // Update the counts of items on the page
                updateItemCounts(data);
            })
            .catch(error => {
                console.error('Error fetching cart items:', error);
            });
    }

    // Function to update the counts of items on the page
    function updateItemCounts(cartItems) {
        const cartItemsArray = Object.entries(cartItems).map(([key, value]) => `${key}:${value}`);
        const itemQuantityPairs = cartItemsArray;
        itemQuantityPairs.forEach(pair => {
            console.log(cartItems);
            let [itemId, quantity] = pair.split(':');
            // Update the quantity of the item on the page
            const quantityElement = document.querySelector(`.quantity[data-item-id="${String(itemId)}"]`);
            if (quantityElement) {
                console.log(quantityElement);
                quantityElement.textContent = quantity;
                quantityElement.dataset.count = quantity;
            }
        });
    }

    // Call the function to fetch cart items when the page loads
    fetchCartItems();

    const minusBtns = document.querySelectorAll('.minus-btn');
    const plusBtns = document.querySelectorAll('.plus-btn');
    const quantities = document.querySelectorAll('.quantity');

    // Event listener for minus buttons
    minusBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const quantityElement = quantities[index];
            const itemId = btn.dataset.itemId;
            const itemName = btn.dataset.itemName;
            let quantity = parseInt(quantityElement.dataset.count);
            if (quantity > 0) {
                quantity--;
                quantityElement.textContent = quantity;
                quantityElement.dataset.count = quantity;
                updateCartItem(itemId, quantity);
                console.log(`Item ${itemId}`);
                console.log(`Updated ${itemName} to ${quantity}`);
            }
            if (quantity <= 0) {
                deleteCartItem(itemId);
                console.log(`Item ${itemId}`);
                console.log(`Removed cart data`);
            }
        });
    });

    // Event listener for plus buttons
    plusBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const quantityElement = quantities[index];
            const itemId = btn.dataset.itemId;
            const itemName = btn.dataset.itemName;
            let quantity = parseInt(quantityElement.dataset.count);
            quantity++;
            quantityElement.textContent = quantity;
            quantityElement.dataset.count = quantity;
            if (quantity === 1) {
                createCartItem(itemId, quantity);
                console.log(`Created ${itemName}`);
            }
            if (quantity > 1) {
                updateCartItem(itemId, quantity);
                console.log(`Item ${itemId}`);
                console.log(`Update ${itemName} to ${quantity}`);
            }
        });
    });

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
