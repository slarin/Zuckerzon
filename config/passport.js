const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const mongoose = require('mongoose');
const bycrypt = require('bcryptjs');

const User = require('../models/User');

//module.exports = function (passport) {

  //Local Strategy
  passport.use(
    new LocalStrategy({ usernameField: 'email'}, (email, password, done) => {
      //match user
      User.findOne({ email: email})
        .then(user => {
          if(!user) {
            return done(null, false, { message: 'That email is not registered'});
          }

          // match password
          bycrypt.compare(password, user.password, (err, isMatch)=>{
            if(err) throw err;

            if(isMatch) {
              return done(null, user);
            }else {
              return done(null, false, {message: 'Password incorrect'});
            }
          });
        })
        .catch(err => console.log(err))
    })
  );

  //Google Strategy
  passport.use(new GoogleStrategy({

      clientID        : process.env.GoogleClientID,
      clientSecret    : process.env.GoogleClientSecret,
      callbackURL     : '/users/auth/google/redirect',
      passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

  },
  function(req, token, refreshToken, profile, done) {

      // asynchronous
      process.nextTick(function() {

          // check if the user is already logged in
          if (!req.user) {

              User.findOne({ 'google.id' : profile.id }, function(err, user) {
                  if (err)
                      return done(err);

                  if (user) {

                      // if there is a user id already but no token (user was linked at one point and then removed)
                      if (!user.google.token) {
                          user.google.token = token;
                          user.google.name  = profile.displayName;
                          user.google.email = profile.email.value; // pull the first email

                          user.save(function(err) {
                              if (err)
                                  throw err;
                              return done(null, user);
                          });
                      }

                      return done(null, user);
                  } else {
                      var newUser          = new User();

                      newUser.google.id    = profile.id;
                      //newUser.google.token = token;
                      newUser.google.name  = profile.displayName;
                      newUser.google.email = profile.emails[0].value; // pull the first email

                      newUser.save(function(err) {
                          if (err)
                              throw err;
                          return done(null, newUser);
                      });
                  }
              });

          } else {
              // user already exists and is logged in, we have to link accounts
              var user               = req.user; // pull the user out of the session

              user.google.id    = profile.id;
              user.google.token = token;
              user.google.name  = profile.displayName;
              user.google.email = profile.emails[0].value; // pull the first email

              user.save(function(err) {
                  if (err)
                      throw err;
                  return done(null, user);
              });

          }

      });

  }));
  
  //Facebook Strategy
    passport.use(new FacebookStrategy({

      // pull in our app id and secret from our auth.js file
      clientID        : process.env.FacebookAppID,
      clientSecret    : process.env.FacebookAppSecret,
      callbackURL     : '/users/auth/facebook/callback',
      passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

  },

  // facebook will send back the token and profile
  function(req, token, refreshToken, profile, done) {

      // asynchronous
      process.nextTick(function() {

          // check if the user is already logged in
          if (!req.user) {

              // find the user in the database based on their facebook id
              User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                  // if there is an error, stop everything and return that
                  // ie an error connecting to the database
                  if (err)
                      return done(err);

                  // if the user is found, then log them in
                  if (user) {
                      return done(null, user); // user found, return that user
                  } else {
                      // if there is no user found with that facebook id, create them
                      var newUser            = new User();

                      // set all of the facebook information in our user model
                      newUser.facebook.id    = profile.id; // set the users facebook id                   
                      //newUser.facebook.token = token; // we will save the token that facebook provides to the user                    
                      newUser.facebook.name  = profile.name.givenName; // look at the passport user profile to see how names are returned
                      newUser.facebook.email = profile.email.value; // facebook can return multiple emails so we'll take the first

                      // save our user to the database
                      newUser.save(function(err) {
                          if (err)
                              throw err;

                          // if successful, return the new user
                          return done(null, newUser);
                      });
                  }

              });

          } else {
              // user already exists and is logged in, we have to link accounts
              var user            = req.user; // pull the user out of the session

              // update the current users facebook credentials
              user.facebook.id    = profile.id;
              //user.facebook.token = token;
              user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
              user.facebook.email = profile.email.value;

              // save the user
              user.save(function(err) {
                  if (err)
                      throw err;
                  return done(null, user);
              });
          }

      });

  }));


  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
//}