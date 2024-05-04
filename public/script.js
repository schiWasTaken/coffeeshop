document.addEventListener('DOMContentLoaded', function() {
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
            const response = await fetch(`/api/cartItems/${itemId}`, {
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

    function convertToItemQuantityPairs(itemQuantityPairs) {
        return itemQuantityPairs.reduce((acc, { itemId, quantity }) => {
            acc[itemId] = quantity;
            return acc;
        }, {});
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
                    // console.log(`Item ${itemId}`);
                    // console.log(`Updated ${itemName} to ${quantity}`);
                    updateCheckoutButtonContainer(); // Call the function after updating the cart
                })
                .catch(error => console.error('Error updating cart item:', error));
            }
            if (quantity <= 0) {
                deleteCartItem(itemId)
                .then(() => {
                    // console.log(`Item ${itemId}`);
                    // console.log(`Removed cart data`);
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
                    // console.log(`Created ${itemName}`);
                    updateCheckoutButtonContainer(); // Call the function after updating the cart
                })
                .catch(error => console.error('Error creating cart item:', error));
            }
            if (quantity > 1) {
                updateCartItem(itemId, quantity)
                .then(() => {
                    // console.log(`Item ${itemId}`);
                    // console.log(`Update ${itemName} to ${quantity}`);
                    updateCheckoutButtonContainer(); // Call the function after updating the cart
                })
                .catch(error => console.error('Error updating cart item:', error));
                // console.log(`Item ${itemId}`);
                // console.log(`Update ${itemName} to ${quantity}`);
            }
        });
    });

    // Function to fetch and update user cart data without page reload
    async function refreshUserCart() {
        try {
            const response = await fetch('/api/userCart');
            const { userCartItems, totalPrice } = await response.json();
            const cartItemTemplate = document.getElementById('cartItemTemplate');
            const cartItemList = document.getElementById('cartItemList');
            cartItemList.innerHTML = "";
            const totalPriceElement = document.getElementById('totalPrice');
    
            userCartItems.forEach(cartItem => {
                const clone = document.importNode(cartItemTemplate.content, true);
                const quantitySpan = clone.querySelector('.count');
                const itemNameSpan = clone.querySelector('.itemName');
                const multipliedPriceSpan = clone.querySelector('.multipliedPrice');
        
                if (cartItem.itemId) {
                    const item = cartItem.itemId;
                    quantitySpan.textContent = `${cartItem.quantity}`;
                    itemNameSpan.textContent = item.name;
                    multipliedPriceSpan.textContent = `Rp.${item.price * cartItem.quantity}`;
                } else {
                    itemNameSpan.textContent = 'Item not found';
                }
        
                cartItemList.appendChild(clone);
            });
            totalPriceElement.textContent = `Rp.${totalPrice.toFixed(2)}`;
        } catch (error) {
            console.error('Error refreshing user cart:', error);
        }
    }


    // Checkout modal
    let checkoutModal = document.getElementById("checkoutModal");
    let checkoutBtn = document.getElementById("checkoutBtn");
    let closeSpan = document.getElementsByClassName("close")[0];
    if (checkoutBtn) {
        // Add event listener to the checkout button
        checkoutBtn.onclick = async function() {
            // Refresh user cart (assuming this function exists)
            await refreshUserCart();
            // Check if the checkout modal exists
            if (checkoutModal) {
                // Display the checkout modal
                checkoutModal.style.display = "flex";
                
            }
        }
    }
    
    // Check if the close span exists
    if (closeSpan) {
        // Add event listener to the close span
        closeSpan.onclick = function() {
            // Check if the checkout modal exists
            if (checkoutModal) {
                // Hide the checkout modal
                checkoutModal.style.display = "none";
            }
        }
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == checkoutModal) {
            checkoutModal.style.display = "none";
        }
    }

    let resetBtn = document.getElementById("resetCartBtn");

    async function resetCart() {
        try {
            const response = await fetch('/api/resetCart');
            if (!response.ok) {
                throw new Error('Failed to reset cart');
            }
            return response.json();
        } catch (error) {
            console.error('Error resetting cart:', error);
            return null;
        }
    }
    if (resetBtn) {
        resetBtn.onclick = async function() {
            const res = await resetCart();
            pairs = convertToItemQuantityPairs(res);
            pairs = Object.keys(pairs).reduce((a,b)=>{a[b]=0; return a}, {});
            updateItemCounts(pairs);
            updateCheckoutButtonContainer();
        }
    }
    
    const searchInput = document.getElementById('searchInput');

    searchInput.addEventListener('input', function(event) {
        const searchText = event.target.value;
        const menuItems = document.getElementsByClassName('menu-item');
        
        for (item of menuItems) {
            const menuItemName = item.getElementsByClassName('menu-item-name')[0];
            const menuItemDescription = item.getElementsByClassName('menu-item-description')[0];
            if (menuItemName.innerText.toLowerCase().includes(searchText.toLowerCase()) || 
                menuItemDescription.innerText.toLowerCase().includes(searchText.toLowerCase()) || 
                searchText == "") {
                item.dataset.hidden = "false";
            }
            else {
                item.dataset.hidden = "true";
            }
        }
    });
    
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
