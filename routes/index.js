var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var multer     = require('multer');
var cloudinary = require('cloudinary');

const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = (req, file, cb) => {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter});

// cloudinary config
cloudinary.config({ 
  cloud_name: 'foodies-corner', 
  api_key: 874182955491168, 
  api_secret: process.env.APISECRET
});

//root route
router.get("/", function(req, res){
    res.render("landing");
});

// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});

//handle sign up logic
router.post("/register", upload.single('image'), (req, res) => {
 if(!req.file) {
  let newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email
  });
  
  if (req.body.adminCode === process.env.ADMIN_CODE) {
    newUser.isAdmin = true;
  }
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        // Duplicate email
        req.flash("error", "That email has already been registered.");
        return res.redirect("/register");
      } 
      // Some other error
      req.flash("error", "Something went wrong...");
      return res.redirect("/register");
    }
    
    passport.authenticate("local")(req, res, () => {
      req.flash("success", "Welcome to Foodies-Corner " + user.username);
      res.redirect("/corners");
    });
  });
 }
	else{
	cloudinary.uploader.upload(req.file.path, (result) => {
  let newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
	avatar : {
        // add cloudinary public_id for the image to the object under image property
        id: result.public_id,
        // add cloudinary url for the image to the object under image property
        url: result.secure_url
      },
    email: req.body.email
  });
  if (req.body.adminCode === process.env.ADMIN_CODE) {
    newUser.isAdmin = true;
  }
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        // Duplicate email
        req.flash("error", "That email has already been registered.");
        return res.redirect("/register");
      } 
      // Some other error
      req.flash("error", "Something went wrong...");
      return res.redirect("/register");
    }
    
    passport.authenticate("local")(req, res, () => {
      req.flash("success", "Welcome to Foodies-Corner " + user.username);
      res.redirect("/corners");
    });
  });
});
	}
});

//show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/corners",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: 'Welcome to Foodies-Corner!'
    }), function(req, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "See you later!");
   res.redirect("/corners");
});


module.exports = router;