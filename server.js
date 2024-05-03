const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const Item = require('./models/item');
const UserCart = require('./models/userCarts');
const Order  = require('./models/order');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const app = express();
const PORT = process.env.PORT || 3000;
const uri = 'mongodb://localhost:27017/coffee';

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }))
const secretKey = crypto.randomBytes(32).toString('hex');
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
// Initialize Passport and session for persistent login sessions
app.use(passport.initialize());
app.use(passport.session());
app.set('view engine', 'ejs');

mongoose.connect(uri);

app.post('/signup', async (req, res) => {

  const { username, password } = req.body;

  try {
      // Check if the username is already taken
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        req.flash('error', 'Username already exists');
        return res.redirect('/signup');
      }
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the user into the "users" collection with the hashed password
      const result = await User.create({username, hashedPassword});
      res.redirect('/login');
    } 
    catch (error) {
        console.error('Error signing up:', error);
        res.redirect('/signup');
    }
});

// Configure Passport local strategy for username/password authentication
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        // Find user by username in your database
        const user = await User.findOne({ username });

        // If user not found or password is incorrect, return false
        if (!user || !(await bcrypt.compare(password, user.hashedPassword))) {
            return done(null, false, { message: 'Incorrect username or password' });
        }

        // If user and password are correct, return user
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Serialize user to store in the session
passport.serializeUser((user, done) => {
    done(null, user._id);
});
// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

// Middleware to protect routes that require authentication
const isAuthenticatedMiddleware = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

const redirectUsersMiddleware = async (req, res, next) => {
    if (req.isAuthenticated()) {
        if (isAdmin(req)) {
            res.redirect('/admin');
            return;
        }
        res.redirect('/userHome');
        return;
    }
    return next();
}

function isAdmin(req) {
    return req.user && req.user.role === 'admin';
}

const isAdminMiddleware = (req, res, next) => {
    if (isAdmin(req)) {
        return next();
    } 
    else {
        res.status(403).json({ error: 'Forbidden' });
    }
}

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/', redirectUsersMiddleware, async (req, res) => {
    res.render('index.ejs', { items: await Item.find() });
});

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});


// Function to calculate the total price of items in the user's cart
async function calculateTotalPrice(userId) {
    try {
        // Fetch the user's cart items from the database
        const userCartItems = await UserCart.find({ userId }).populate('itemId');

        // Calculate the total price
        let totalPrice = 0;
        userCartItems.forEach(cartItem => {
            const itemPrice = cartItem.itemId.price;
            const itemQuantity = cartItem.quantity;
            totalPrice += itemPrice * itemQuantity;
        });

        return totalPrice;
    } catch (error) {
        console.error('Error calculating total price:', error);
        return null;
    }
}

app.get('/api/userCart', isAuthenticatedMiddleware, async (req, res) => {
    try {
        // Query the user's cart to get the item IDs
        const userId = req.user._id;
        const userCartItems = await UserCart.find({ userId: userId }).populate('itemId');
        const totalPrice = await calculateTotalPrice(userId);
        res.status(200).json({ userCartItems, totalPrice });
    } catch (error) {
        console.error('Error fetching user cart:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/userHome', isAuthenticatedMiddleware, async (req, res) => {
    res.render('userHome.ejs', { user: req.user, items: await Item.find(), userCarts: await UserCart.find(), order: await Order.find({userId: req.user._id, purchased: false})});
});

app.get('/signup', redirectUsersMiddleware, (req, res) => {
    res.render('signup.ejs', { message: req.flash('error') });
});

app.get('/login', redirectUsersMiddleware, (req, res) => {
    // Render login form with flashed error message (if any)
    res.render('login.ejs', { message: req.flash('error') });
});

app.get('/profile', isAuthenticatedMiddleware, (req, res) => {
    res.render('profile.ejs', { user: req.user }); // Assuming req.user contains user information
});

// Handle renaming user
app.post('/rename', isAuthenticatedMiddleware, async (req, res) => {
    const newUsername = req.body.newUsername;
    try {
        if (newUsername == "") {
            throw new Error('Cannot rename user to empty string');
        }
        // Update username in the database
        await User.findByIdAndUpdate(req.user._id, { username: newUsername });
        res.redirect('/userHome'); // Redirect to userHome page
    } catch (error) {
        console.error('Error renaming user:', error);
        res.redirect('/profile'); // Redirect back to profile page with an error message
    }
});

// Handle deleting user
app.post('/deleteUser', isAuthenticatedMiddleware, async (req, res) => {
    try {
        // Delete user from the database
        await User.findByIdAndDelete(req.user._id);
        req.logout(() => {
        });
        res.redirect('/'); // Redirect to login page
    } catch (error) {
        console.error('Error deleting user:', error);
        res.redirect('/profile'); // Redirect back to profile page with an error message
    }
});

app.get('/api/cartItems', isAuthenticatedMiddleware, async (req, res) => {
    try {
        // Fetch cart items from the database
        const cartItems = await UserCart.find({ userId: req.user._id });
        
        // Prepare the response data
        const responseData = cartItems.reduce((acc, userCart) => {
            acc[userCart.itemId] = userCart.quantity;
            return acc;
        }, {});

        // Send the cart items as JSON response
        res.json(responseData);
    } catch (error) {
        // Handle errors and send an error response
        console.error('Error fetching cart items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to create a new cart item
app.post('/api/cartItems', isAuthenticatedMiddleware, async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        const userId = req.user._id;
        // Delete any existing ones first
        const existingCartId = await UserCart.findOne({ userId: userId, itemId: itemId })
        await UserCart.findByIdAndDelete(existingCartId); 

        if (!Item.findById(itemId)) {
            throw new Error('Item is invalid');
        }
        const newItem = UserCart.create({ userId, itemId, quantity });
        const savedItem = (await newItem).save();
        res.status(201).json(savedItem);
    } catch (error) {
        console.error('Error creating UserCart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to update an existing cart item
app.put('/api/cartItems/:itemId', isAuthenticatedMiddleware, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user._id.toString();
        const cartId = await UserCart.findOne({ userId: userId, itemId: itemId })
        if (!Item.findById(itemId)) {
            throw new Error('Item is invalid');
        }
        const updatedItem = await UserCart.findByIdAndUpdate(cartId, { quantity }, { new: true });
        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating UserCart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to delete an existing cart item
app.delete('/api/cartItems/:itemId', isAuthenticatedMiddleware, async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user._id.toString();
        const cartId = await UserCart.findOne({ userId: userId, itemId: itemId })
        await UserCart.findByIdAndDelete(cartId);
        res.sendStatus(204);
    } catch (error) {
        console.error('Error deleting UserCart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to place order
app.get('/api/placeOrder', isAuthenticatedMiddleware, async (req, res) => {
    try {
        const cartItems = await UserCart.find({ userId: req.user._id });
        if (cartItems.length == 0) {
            throw new Error('Item is empty');
        }
        const userId = req.user._id;
        const userAlreadyOrdered = await Order.findOne({ userId: userId, purchased: false });
        if (userAlreadyOrdered != null ) {
            throw new Error('User has a pending order');
        }
        const orderId = new mongoose.Types.ObjectId();
        const newOrder = Order.create({ _id: orderId, userId: userId, items: cartItems });
        (await newOrder).save();
        await UserCart.deleteMany({ userId: req.user._id });
        res.redirect(`/orderSuccess?orderId=${orderId}`);
    } catch (error) {
        console.error('Error creating Order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/resetCart', isAuthenticatedMiddleware, async (req, res) => {
    try {
        const cartItems = await UserCart.find({ userId: req.user._id });
        await UserCart.deleteMany({ userId: req.user._id });
        res.status(200).json(cartItems);
    } catch (error) {
        console.error('Error resetting cart', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/cancelOrder', isAuthenticatedMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({ userId: req.user._id, purchased: false });
        if (order == null) {
            throw new Error('Order already marked as purchased');
        }
        await Order.deleteOne({ userId: req.user._id, purchased: false });
        res.redirect('/');
    } catch (error) {
        console.error('Error cancelling order', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/orderSuccess', isAuthenticatedMiddleware, async (req, res) => {
    try {
        const orderId = req.query.orderId; // Get the orderId from the query parameters
        const { userMap, itemMap, ordersWithTotalPrice } = await myCoolFunction({orderId});
        res.render('orderSuccess', { orderId, userMap, itemMap, ordersWithTotalPrice });
    } catch (error) {
        console.error('Error rendering orderSuccess:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/admin', isAuthenticatedMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        // Fetch all orders from the database, sorted by newest first
        const { userMap, itemMap, ordersWithTotalPrice } = await myCoolFunction({});
        res.render('admin', {userMap, itemMap, ordersWithTotalPrice});
    } catch (error) {
        console.error('Error rendering admin:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/markOrderPurchased', isAuthenticatedMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const orderId = req.query.orderId;
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const { userMap, itemMap, ordersWithTotalPrice } = await myCoolFunction({orderId});
        // Return the updated order
        res.render('resolveOrder.ejs', { userMap, itemMap, ordersWithTotalPrice, orderId });
    } catch (error) {
        console.error('Error marking order as purchased:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/resolveOrder', isAuthenticatedMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const orderId = req.query.orderId;
        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        // Find the order by its ID and update its status
        const order = await Order.findByIdAndUpdate(orderId, { purchased: true }, { new: true });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update user's points
        const user = await User.findById(order.userId);
        user.points += 10; // Add 10 points for the approved order
        await user.save(); // Save updated user data

        res.redirect('/admin');
    } catch (error) {
        console.error('Error marking order as purchased:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

async function myCoolFunction({orderId}) {
    const orderHistory = (orderId === undefined) 
    ? await Order.find().sort({ createdAt: -1 }) 
    : [await Order.findById(orderId).sort({ createdAt: -1 })]
    ;

    // Fetch users corresponding to orderHistory
    // and create a map of user IDs to user objects
    const orderUsers = await User.find(
        { _id: { $in: orderHistory.map(order => order.userId) } },
        "username"
    );
    const userMap = orderUsers.reduce((acc, user) => {
        acc[user._id] = user;
        return acc;
    }, {});

    // Extract all unique item IDs from orderHistory
    const allItemIds = orderHistory.flatMap(order => order.items.map(item => item.itemId));
    const uniqueItemIds = [...new Set(allItemIds)];

    // Fetch items corresponding to uniqueItemIds
    // and create a map of item IDs to item objects
    const items = await Item.find({ _id: { $in: uniqueItemIds } });
    const itemMap = items.reduce((acc, item) => {
        acc[item._id] = item;
        return acc;
    }, {});

    // Map each order's items to include the actual item data
    const ordersWithItems = orderHistory.map(order => ({
        ...order.toObject(),
        items: order.items.map(item => ({
            ...item.toObject(),
            itemData: itemMap[item.itemId]
        }))
    }));
    const ordersWithTotalPrice = ordersWithItems.map(order => {
        // Calculate total price for each order
        let totalPrice = 0;
        order.items.forEach(item => {
            const currentItem = itemMap[item.itemId];
            totalPrice += currentItem.price * item.quantity;
        });

        // Return order object with total price
        return {
            ...order,
            totalPrice: totalPrice
        };
    });
    return { userMap, itemMap, ordersWithTotalPrice };
}

