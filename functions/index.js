require('dotenv').config();
const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const md5 = require('md5');
const User = require('../models/User');

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  ),
  databaseURL: process.env.databaseURL,
});

const db = firebaseAdmin.firestore();
const collectionRef = 'users';

const app = express();
app.use(
  cors({
    origin: true,
  })
);
app.use(express.static('public'));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

const PORT = process.env.PORT || 5000;
const copyrightYear = new Date().getFullYear();

app.get('/', (req, res) => {
  res.render('index', {
    pageTitle: 'Welcome',
    headerTitle: 'Psst... Have a secret?',
    copyrightYear,
  });
});

app.get('/login', (req, res) => {
  res.render('login', {
    pageTitle: 'Login',
    headerTitle: 'Login',
    copyrightYear,
  });
});

app.get('/register', (req, res) => {
  res.render('register', {
    pageTitle: 'Register',
    headerTitle: 'Register User',
    copyrightYear,
  });
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const user = new User(email, md5(password));

  try {
    const docRef = db.collection(collectionRef).doc();
    const doc = await docRef.set(user);
    if (doc) {
      return res.render('registerSuccess', {
        pageTitle: 'Register Success',
        headerTitle: 'Register success',
        copyrightYear,
      });
    }
    return res.status(400).sendFile(path.join(__dirname, '../public/404.html'));
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ msg: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const query = db
      .collection(collectionRef)
      .where('email', '==', email)
      .where('password', '==', md5(password));
    const result = await query.get();

    if (result) {
      return res.status(200).render('home', {
        pageTitle: 'Home',
        headerTitle: 'Home',
        copyrightYear,
      });
    }
    return res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
  } catch (error) {
    console.error(error.message);
    return res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => console.log(`Server started at port ${PORT}`));

exports.app = functions.https.onRequest(app);
