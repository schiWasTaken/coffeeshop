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
    async function fetchCartItems() {
        // Make a GET request to fetch cart items
        try {
            const response = await fetch('/api/cartItems');
            if (!response.ok) {
                throw new Error('Failed to fetch cart items');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching cart items:', error);
            return null;
        }
    }

    function extractItemQuantityPairs(cartItems) {
        const cartItemsArray = Object.entries(cartItems).map(([key, value]) => `${key}:${value}`);
        return cartItemsArray.map(pair => {
            let [itemId, quantity] = pair.split(':');
            return { itemId, quantity };
        });
    }

    // Function to update the counts of items on the page
    function updateItemCounts(cartItems) {
        const itemQuantityPairs = extractItemQuantityPairs(cartItems);
        itemQuantityPairs.forEach(pair => {
            let { itemId, quantity } = pair;
            const quantityElement = document.querySelector(`.quantity[data-item-id="${String(itemId)}"]`);
            if (quantityElement) {
                quantityElement.textContent = quantity;
                quantityElement.dataset.count = quantity;
            }
        });
    }

    // Call the function to fetch cart items when the page loads
    fetchCartItems().then(data => {
        updateItemCounts(data);
        updateCheckoutButtonContainer();
    });
    
    function calculateTotalQuantity(itemQuantityPairs) {
        let totalQuantity = 0;
        itemQuantityPairs.forEach(pair => {
            let { itemId, quantity } = pair;
            totalQuantity += Number(quantity);
        });
        console.log(totalQuantity);
        return totalQuantity;
    }
    
    function updateCheckoutButtonContainer() {
        fetchCartItems()
            .then(data => {  
                const itemQuantityPairs = extractItemQuantityPairs(data);
                const totalQuantity = calculateTotalQuantity(itemQuantityPairs);
                const checkoutButtonContainer = document.getElementById('checkoutButtonContainer');

                if (totalQuantity >= 1) {
                    // Show the checkout button container
                    checkoutButtonContainer.style.display = 'block';
                } else {
                    // Hide the checkout button container
                    checkoutButtonContainer.style.display = 'none';
                }
            }) 
    }
    

    // Plus minus buttons for menu
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
                updateCartItem(itemId, quantity)
                .then(() => {
                    console.log(`Item ${itemId}`);
                    console.log(`Updated ${itemName} to ${quantity}`);
                    updateCheckoutButtonContainer(); // Call the function after updating the cart
                })
                .catch(error => console.error('Error updating cart item:', error));
            }
            if (quantity <= 0) {
                deleteCartItem(itemId)
                .then(() => {
                    console.log(`Item ${itemId}`);
                    console.log(`Removed cart data`);
                    updateCheckoutButtonContainer(); // Call the function after updating the cart
                })
                .catch(error => console.error('Error deleting cart item:', error));
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
            if (quantity >= 10) {
                return;
            }
            quantity++;
            quantityElement.textContent = quantity;
            quantityElement.dataset.count = quantity;
            if (quantity === 1) {
                createCartItem(itemId, quantity)
                .then(() => {
                    console.log(`Created ${itemName}`);
                    updateCheckoutButtonContainer(); // Call the function after updating the cart
                })
                .catch(error => console.error('Error creating cart item:', error));
            }
            if (quantity > 1) {
                updateCartItem(itemId, quantity)
                .then(() => {
                    console.log(`Item ${itemId}`);
                    console.log(`Update ${itemName} to ${quantity}`);
                    updateCheckoutButtonContainer(); // Call the function after updating the cart
                })
                .catch(error => console.error('Error updating cart item:', error));
                console.log(`Item ${itemId}`);
                console.log(`Update ${itemName} to ${quantity}`);
            }
        });
    });

    // Function to fetch and update user cart data without page reload
    function refreshUserCart() {
        fetch('/userCart')
            .then(response => response.text())
            .then(html => {
                // Replace the content of the user cart container with the updated HTML
                document.getElementById('user-cart-container').innerHTML = html;
            })
            .catch(error => {
                console.error('Error refreshing user cart:', error);
            });
    }


    // Checkout modal
    let modal = document.getElementById("checkoutModal");
    let btn = document.getElementById("checkoutBtn");
    let span = document.getElementsByClassName("close")[0];
    btn.onclick = function() {
        refreshUserCart();
        modal.style.display = "block";
    }
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
    }

    // Scroll to top
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
