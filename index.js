const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const MongoStore = require('connect-mongo');
var session = require("express-session");

const app = express();
var username = "";
var userid = "";
var verify = false;
var values = [];
var vX = [];
var vY = [];
var nodemailer = require('nodemailer');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.use(session({
    secret: "success",
    resave: false,
    saveUninitialized: true,
    crypto: {
        secret: 'squirrel'
    },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
        ttl: 60 * 60,
        autoRemove: 'native'
    })
}));

mongoose.connect(process.env.MONGODB_URL);

const userSchema = new mongoose.Schema({
    username: String,
    authX: Array,
    authY: Array,
    authimg: Array,
    status: Boolean,
    verify: Boolean
}, 
{ collection : 'gpa_users' });

const User = mongoose.model("User", userSchema)
//main
app.get("/", function(req, res) {
    res.render("login");
});

app.get("/l-password", function(req, res) {
    res.render("logpassword");
});

//login
app.get("/login", function(req, res) {
    res.render("login");
});


app.post("/login", function(req, res) {
    username = req.body.username;
    if(typeof req.session.user?.uuid === 'undefined')
    {        
        User.find({'username': username}, function (err, docs) {
            if (err){
                console.log(err);
            }
            else{
                if(Object.keys(docs).length === 1){
                    if(docs[0].verify) {
                        verify = docs[0].verify;
                        res.redirect("/auth");
                    }
                    else {
                        res.render("verify");
                    }
                }
                else {
                    res.send("Email Not yet registered");
                }
            }
        });
    }
    else {
        User.find({'username': username}, function (err, docs) {
            if (err){
                console.log(err);
            }
            else{
                if(docs[0]._id == req.session.user.uuid) {
                    res.redirect("home");
                }
                else {
                    res.redirect("/auth");
                }
            }
        });
    }
});

app.get("/auth",function(req,res) {
    if(username)
    {
    User.find({'username': username}, function (err, docs) {
        if (err){
            console.log(err);
        }
        else{
            if(Object.keys(docs).length === 0) {
                res.send('Email Not registered yet');
            }
            else {
                if(docs[0]._doc.verify){
                    if(docs.length) {
                        var vXTemp = docs[0]._doc.authX;
                        var vYTemp = docs[0]._doc.authY;
                        vX = vXTemp.map(Number);
                        vY = vYTemp.map(Number);
                        userid = docs[0]._doc._id;
                        values = Object.values(docs[0]._doc.authimg);
                        res.render('logpassword',{'img1':values[0],'img2':values[1],'img3':values[2]});
                    }
                    else {
                        res.send("Nothing");
                    }
                }
                else {
                    res.redirect('verify');
                }
            }
        }
    });
}
else {
    res.send("Authentication Failed");
}
});

app.post("/logpassword", function(req, res) {
    var coordX = req.body.coordX;
    var coordY = req.body.coordY;
    var cXTemp = coordX.split(",");
    var cYTemp = coordY.split(",");
    var cX = cXTemp.map(Number);
    var cY = cYTemp.map(Number);
    if((vX[0]-10 <= cX[0] && cX[0] <= vX[0]+10) && (vX[1]-10 <= cX[1] && cX[1] <= vX[1]+10) && (vX[2]-10 <= cX[2] && cX[2] <= vX[2]+10)) {
        if((vY[0]-10 <= cY[0] && cY[0] <= vY[0]+10) && (vY[1]-10 <= cY[1] && cY[1] <= vY[1]+10) && (vY[2]-10 <= cY[2] && cY[2] <= vY[2]+10)) {
            req.session.user = {
                uuid: userid,
            }
            req.session.save();
            res.redirect("/home");
        }
        else {
            res.send("Authentication Failed");
        }
    }
    else {
        res.send("Authentication Failed");
    }
});

//register
app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
    User.find({'username': req.body.username}, function (err, docs) {
        if (err){
            console.log(err);
        }
        else{
            if(docs.length == 0) {
                username = req.body.username;
                res.redirect('select');
            }
            else {
                res.send("Email already available");
            }
        }
    });
});

app.get("/select", function(req,res){
    if(username){
        res.render('select');
    }
    else {
        res.send("Authentication Failed");
    }
})

app.post("/select", function(req,res) {
    values = Object.values(req.body);
    res.redirect("regpassword");
});

app.get("/regpassword", function(req,res){
    if(username) {
        res.render("regpassword",{'img1':values[0],'img2':values[1],'img3':values[2]});
    }
    else {
        res.send("Authentication Failed");
    }
})

app.post("/regpassword", function(req, res) {
    var coordX = req.body.coordX;
    var coordY = req.body.coordY;
    var cX = coordX.split(",");
    var cY = coordY.split(",");
    var myData = new User({
        username: username,
        authX: [cX[0],cX[1],cX[2]],
        authY: [cY[0],cY[1],cY[2]],
        authimg: values,
        status: true,
        verify: false,
    });
    myData.save();
    // res.send("success");
    res.redirect("mail");
});

//home
app.get("/home", function(req, res) {
    if(typeof req.session.user?.uuid === 'undefined') {
        res.send("Authentication Failed");
    }
    else {
        console.log(req.session.user.uuid);
        res.render("home");
    }
});

//common
app.get("/verify", function(req, res) {
    if(verify) {
        res.redirect("/auth");
    }
    else {
        res.render("verify");
    }
});

app.get("/mail", function(req, res){
    User.find({'username': username}, function (err, docs) {
        if (err){
            console.log(err);
        }
        else{
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASS
        }
    });
    const mailOptions = {
            from: process.env.FROM,
            to: username,
            subject: 'Verification Email',
            text: 'This is the Verification Email to activate your account - '+'https://gpa-main.herokuapp.com/authverify?uname='+username+'&auth='+docs[0]._id.toString()
    }
    transporter.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log('mail sent');
        } 
    });
}
});
res.render('sendmail');
});

app.get("/authverify",function(req,res){
    var uname = req.query.uname;
    var authVal = req.query.auth;
    if(uname) {
        console.log("1");
        User.find({'username': uname, '_id': authVal}, function (err, docs) {
            if (err){
                console.log("2");
                console.log(err);
            }
            else{
                console.log("3");
                User.updateOne({'username': uname},{ $set: { verify: true } }, function(err, res){
                    if(err) {
                        console.log("4");
                        res.send(err);
                    }
                    else {
                        console.log("5");
                        res.send("Successfully Verified");
                    }
                });
            }
        });
    }
    else {
        console.log("6");
        res.send("Authentication Failed");
    }
});

app.get("/logout",(req,res)=>{
    req.session.destroy();
    res.send("logout successfully");
})

//PORT
app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");
});
