const express    = require("express"),
      router     = express.Router(),
      User       = require("../models/user"),
      Corner = require("../models/corner"),
      middleware = require("../middleware");
var multer     = require('multer');
var cloudinary = require('cloudinary');
var { isLoggedIn, checkUserCorner, checkUserComment, isAdmin, isSafe } = middleware;

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
      
// User profile
router.get("/:id", isLoggedIn, (req, res) => {
  User.findById(req.params.id, (err, foundUser) => {
    if (err || !foundUser) {
      req.flash("error", "Something went wrong...");
      res.redirect("/corners");
    } else {
      Corner.find().where("author.id").equals(foundUser._id).exec((err, corners) => {
        if (err) {
          req.flash("error", "Something went wrong...");
          res.redirect("/corners");
        } else { res.render("users/show", { user: foundUser, corners }); }
      });
    }
  });
});

// show edit form
var avatarId, avatarUrl ,user_name;
router.get("/:id/edit", middleware.isLoggedIn, (req, res) => {
  User.findById(req.params.id, (err, foundUser) => {
    if (err || !foundUser) { return res.redirect("back"); }
    if (foundUser._id.equals(req.user._id)) {
	  avatarId = foundUser.avatar.id;
      avatarUrl = foundUser.avatar.url;
	  user_name = foundUser.username;
      res.render("users/edit", { user: foundUser }); 
    } else {
      req.flash("error", "You don't have permission to do that");
      res.redirect("back");
    } 
  });
});

// update profile
router.put("/:id", isLoggedIn, upload.single('image'), (req, res) => {
if(!req.file) {
	var newUser = {
    username: user_name,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
	avatar : {
        // add cloudinary public_id for the image to the campground object under image property
        id: avatarId,
        // add cloudinary url for the image to the campground object under image property
        url: avatarUrl
      },
    email: req.body.email
  };
	 User.findByIdAndUpdate(req.params.id, {$set: newUser}, (err, updatedUser) => {
    if (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        // Duplicate email
        req.flash("error", "That email has already been registered.");
        return res.redirect("/users" + req.params.id);
      } 
      // Some other error
      req.flash("error", "Something went wrong...");
      return res.redirect("/users" + req.params.id);
    }
    if (updatedUser._id.equals(req.user._id)) {
      res.redirect("/users/" + req.params.id);
    } else {
      req.flash("error", "You don't have permission to do that");
      res.redirect("/corners");
    }
  });
}
else {
	cloudinary.uploader.upload(req.file.path, (result) => {
	var newUser = {
    username: user_name,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
	avatar : {
// add cloudinary public_id for the image to the campground object under image property
          id: result.public_id,
          // add cloudinary url for the image to the campground object under image property
          url: result.secure_url
      },
    email: req.body.email
  };
	cloudinary.uploader.destroy(imageId, (result) => { console.log(result) });
	 User.findByIdAndUpdate(req.params.id, {$set: newUser}, (err, updatedUser) => {
    if (err) {
      if (err.name === 'MongoError' && err.code === 11000) {
        // Duplicate email
        req.flash("error", "That email has already been registered.");
        return res.redirect("/users" + req.params.id);
      } 
      // Some other error
      req.flash("error", "Something went wrong...");
      return res.redirect("/users" + req.params.id);
    }
    if (updatedUser._id.equals(req.user._id)) {
      res.redirect("/users/" + req.params.id);
    } else {
      req.flash("error", "You don't have permission to do that");
      res.redirect("/corners");
    }
  });
	});
}
});

module.exports = router;