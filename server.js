const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;
const uri = 'mongodb://localhost:27017/coffee';

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }))

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
