//jshint esversion:6

require("dotenv").config(); // allways add dotenv on top if you are using it 
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
var md5 = require("md5"); //required for hashing passwords

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });

//an advanced way of writing a mongoose schema (required inorder to use mongoose-encryption)
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
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password) //turn password into ireversible harsh with md5()

    });
    newUser.save(function(err) {
        if (!err) {
            res.render("secrets");
        } else {
            console.log(err);
        }
    });
});

app.post("/login", function(req, res) {
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({ email: username },

        function(err, foundUser) {
            if (err) {
                return handleError(err);
            } else {
                if (foundUser) { //user is found
                    if (foundUser.password === password) { // user's password === to database password

                        res.render("secrets"); //render the secrets page

                    }

                }
            }

        });
});

app.listen(3000, function() {
    console.log("server running on port 3000");
});