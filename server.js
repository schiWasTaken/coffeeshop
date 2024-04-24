const express = require('express');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const Item = require('./models/item');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const app = express();
const PORT = process.env.PORT || 3000;
const uri = 'mongodb://localhost:27017/coffee';

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }))
// Configure session middleware
app.use(session({
    secret: 'your-secret-key',
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
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/', async (req, res) => {
    res.render('index.ejs', { items: await Item.find() });
});

app.get('/logout', (req, res) => {
    req.logout({}, () => {
        res.redirect('/');
    });
});

app.get('/dashboard', isAuthenticated, async (req, res) => {
    
    res.render('dashboard.ejs', { user: req.user, items: await Item.find() });
});

app.get('/signup', (req, res) => {
    res.render('signup.ejs', { message: req.flash('error') });
});

app.get('/login', (req, res) => {
    // Render login form with flashed error message (if any)
    res.render('login.ejs', { message: req.flash('error') });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
