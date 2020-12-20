//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate"); //require findOrCreate module for findOrCreate() to refer to

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// always setup session bellow the code above
app.use(session({
    secret: "Our little secret.",
    resave: false, // research on this property
    saveUninitialized: false // research on this property
}));


app.use(passport.initialize());
app.use(passport.session());

//googles passport strategy
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    //accessToken allows us to get data from user
    //refreshToken allows us to access user data for a longer period of time
    //profile contains user email, id etc
    function(accessToken, refreshToken, profile, cb) {
        //find user or creat them if they dont exist
        User.findOrCreate({ googleId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));

//facebook passport strategy
passport.use(new FacebookStrategy({
        clientID: process.env.CLIENT_ID_FB,
        clientSecret: process.env.CLIENT_SECRET_FB,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ facebookId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true); // avoid 'useCreateIndex' deprecation warning

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String
});

// add passportLocalMongoose to the mongoose schema as a plugin
//use passportLocalMongoose to hash and salt passwords and save users into mongoDB database
//it will do a lot of heavy lifting
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate); // add findOrCreate as a plugin to userSchema

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); // create a strategy to authenticate users using userName and password

//serialize and deserialize is only necessary when using session
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

app.get("/", function(req, res) {

    res.render("home");
});

app.get("/auth/google",
    //initiate authentication with google, using google strategy
    passport.authenticate("google", { scope: ["profile"] }));

//url redirect
app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

//facebook auth

app.get("/auth/facebook",
    passport.authenticate("facebook"));

app.get("/auth/facebook/secrets",
    passport.authenticate("facebook", { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    });

app.get("/login", function(req, res) {

    res.render("login");
});



app.get("/register", function(req, res) {

    res.render("register");
});

app.get("/secrets", function(req, res) {

    if (req.isAuthenticated()) { // user is authenticated, 
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.post("/register", function(req, res) {

    User.register({ username: req.body.username }, req.body.password, function(err, user) {

        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            // passport.authenticate("type of authentication", )
            passport.authenticate("local")(req, res,

                // callback is only triggerd if authentiation is successfull
                // and we managed to setup a cookie that saved current logged in session
                function() {
                    res.redirect("/secrets"); //if user i logged in redirect them to secrets route
                });
        }
    });
});

app.get("/logout", function(req, res) {
    //deauthenticate user and end user session
    req.logout();
    res.redirect("/");
});

app.post("/login", function(req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    //use passport to login the user and authenticate them (login() and register(), are both passport methods)
    req.login(user, function(err) {
        if (err) {
            console.log(err);

        } else { //authenticate the user
            passport.authenticate("local")(req, res,
                function() {
                    res.redirect("/secrets");
                });
        }
    })
});

app.listen(3000, function() {
    console.log("server running on port 3000");
});