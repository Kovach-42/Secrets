//jshint esversion:6

require("dotenv").config(); // allways add dotenv on top if you are using it 
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
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


app.use(passport.initialize()); // use passport and initialize the passport package
app.use(passport.session()); // use passport to deal with the sessions

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true); // avoid 'useCreateIndex' deprecation warning

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// add passportLocalMongoose to the mongoose schema as a plugin
//use passportLocalMongoose to hash and salt passwords and save users into mongoDB database
//it will do a lot of heavy lifting
userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); // create a strategy to authenticate users using userName and password

//serialize and deserialize is only necessary when using session
passport.serializeUser(User.serializeUser()); // stuf user identification into the cookie
passport.deserializeUser(User.deserializeUser()); // allow passport to crumble the cookie and discover the message inside


app.get("/", function(req, res) {

    res.render("home");
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