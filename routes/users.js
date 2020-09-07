const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

// User model
const People = require('../models/User');

// Login
router.get('/sign-in', (req, res) => res.render('sign-in'));

// Register
router.get('/#footer', (req, res) => res.render('homepage'));

// Register Handler
router.post('/register', (req, res) => {

  const { name, email, password, password2 } = req.body;
  let errors = [];

  // Error handler
  if(!name||!email||!password||!password2) {
    errors.push({ msg: 'Please fill in all the fields'});
  }
  if(password != password2) {
    errors.push({ msg: 'Passwords do not match'});
  }
  if(password.length < 6) {
    errors.push({ msg: 'choose a longer password'});
  }
  if(errors.length > 0){
    res.render('homepage', {
      errors,
      name,
      email,
      password,
      password2
    });
  } else {
    People.findOne({ email: email })
      .then(user => {
        if(user) {
          errors.push({ msg: 'Email is already registered'})
          res.render('register', {
            errors,
            name,
            email,
            password,
            password2
          });
        } else {
            const newUser = new People();
                  newUser.local.name = name;
                  newUser.local.email = email;
                  newUser.local.password = password;
            
           //Password
           bcrypt.genSalt(10, (err, salt) => 
            bcrypt.hash(newUser.local.password, salt, (err, hash) => {
             if(err) throw err;

             newUser.local.password = hash;
             newUser.save()
              .then(user => {
                req.flash('success_msg', 'You have been registered! Sign in.');
                res.redirect('/users/sign-in');
              })
              .catch(err => console.log(err));
           }))
        }
      });
  }
});

// Login handler
//Local
router.post('/sign-in', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/sign-in',
    failureFlash: true
  })(req, res, next);
});

//Google
router.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

router.get('/auth/google/redirect',(req,res, next)=>{
  passport.authenticate('google', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/sign-in',
    failureFlash: true
  })(req, res, next);
});

//Facebook
router.get('/auth/facebook', passport.authenticate('facebook', {scope:'email'}));

router.get('/auth/facebook/callback',(req,res, next)=>{
  passport.authenticate('facebook', {
    successRedirect: '/dashboard',
    failureRedirect: '/users/sign-in',
    failureFlash: true
  })(req,res, next);
});

// Logout handler
router.get('/sign-out', (req, res) => {
  req.logout();
  req.flash('success_msg', 'you are signed out');
  res.redirect('/');
});


module.exports = router;