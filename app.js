//jshint esversion:6

require("dotenv").config(); // allways add dotenv on top if you are using it 
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // required for hashing passwords
const saltRounds = 10; // Number of salt rounds

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


const User = new mongoose.model("User", userSchema);

app.get("/", function(req, res) {

    res.render("home");
});

app.get("/login", function(req, res) {

    res.render("login");
});

app.get("/register", function(req, res) {

    res.render("register");
});

app.post("/register", function(req, res) {

    // bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
    //     // Store hash in your password DB.
    // });

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        //create the user only after generating the hash

        const newUser = new User({
            email: req.body.username,
            password: hash //add has password to doc

        });
        newUser.save(function(err) {
            if (!err) {
                res.render("secrets");
            } else {
                console.log(err);
            }
        });
    });


});

app.post("/login", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username },

        function(err, foundUser) {
            if (err) {
                console.log(err);
            } else {
                if (foundUser) { //user is found

                    //compare bcrypt password with database password and login
                    bcrypt.compare(password, foundUser.password, function(err, result) {

                        if (result === true) { //if result of compare is true 

                            res.render("secrets"); //render the secrets page

                        }
                    });


                }
            }

        });
});

app.listen(3000, function() {
    console.log("server running on port 3000");
});