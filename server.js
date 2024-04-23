const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
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

// Initialize Passport and session for persistent login sessions
app.use(passport.initialize());
app.use(passport.session());

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongoDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

connectToMongoDB();

app.post('/signup', async (req, res) => {

  const { username, password } = req.body;

  try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the user into the "users" collection with the hashed password
      const result = await client.db().collection('users').insertOne({
          username,
          hashedPassword // Use a different key to store the hashed password
      });

      res.status(201).send('User created successfully');
  } catch (error) {
      console.error('Error signing up:', error);
      res.status(500).send('An error occurred during sign up');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Find the user by name
  const user = await client.db().collection('users').findOne({ username });

  if (!user) {
      return res.status(404).send('User not found');
  }

  // Compare the provided password with the hashed password
  const passwordMatch = await bcrypt.compare(password, user.hashedPassword); // Use the correct key to retrieve the hashed password

  if (passwordMatch) {
      res.send('Login successful');
  } else {
      res.status(401).send('Incorrect password');
  }
});


// Configure Passport local strategy for username/password authentication
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        // Find user by username in your database
        const user = await User.findOne({ username });

        // If user not found or password is incorrect, return false
        if (!user || !(await bcrypt.compare(password, user.password))) {
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
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        // Find user by id in your database
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

// Example routes for login, logout, and protected resource
app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

app.get('/dashboard', isAuthenticated, (req, res) => {
    res.send('Welcome to the dashboard!');
});

app.get('/login', (req, res) => {
    res.send('Login form goes here');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
