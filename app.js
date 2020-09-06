const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const memoryStore = require('memorystore')(session);
const passport = require('passport');
const favicon = require('serve-favicon');
if(process.env.NODE_ENV !== 'production'){require('dotenv').config();}

const app = express();
app.use(express.static(path.join(__dirname, '/public')));

//Favicon
app.use(favicon(path.join(__dirname, 'public', '/images/favicon.ico')));

// Passport
require('./config/passport');
//(passport);

// Database Configuration
const db = process.env.MongoURI;

// Connect to MongoDB
mongoose.connect(db, { useNewUrlParser: true})
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Bodyparser
app.use(express.urlencoded({ extended: false }));

// Express session
app.use(session({
  cookie: { maxAge: 86400000 },
  store: new memoryStore({ 
    checkPeriod: 86400000
  }),
  secret: 'secret',
  //resave: true,
  //saveUninitialized: true,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash
app.use(flash());

// Flash message variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

//Routes
  app.use('/', require('./routes/index'));
  app.use('/users', require('./routes/users'));

const PORT = process.env.PORT || 9090;

app.listen(PORT, '0.0.0.0', console.log(`server running on port ${PORT}`));