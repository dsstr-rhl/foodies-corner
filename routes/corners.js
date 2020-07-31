var express = require("express");
var router  = express.Router();
var Corner = require("../models/corner");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var multer     = require('multer');
var cloudinary = require('cloudinary');
var { isLoggedIn, checkUserCorner, checkUserComment, isAdmin, isSafe } = middleware; // destructuring assignment

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

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//INDEX - show all corners
router.get("/", function(req, res){
  if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all corners from DB
      Corner.find({name: regex}, function(err, allCorners){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allCorners);
         }
      });
  } else {
      // Get all corners from DB
      Corner.find({}, function(err, allCorners){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allCorners);
            } else {
              res.render("corners/index",{corners: allCorners, page: 'corners'});
            }
         }
      });
  }
});

//CREATE - add new corner to DB
router.post("/", isLoggedIn, upload.single('image'), (req, res) => {
  if(!req.file) {
	  req.flash('error', 'What a f-corner would be without image!!..Please upload one..');
      return res.redirect('/corners/new');
  }
	cloudinary.uploader.upload(req.file.path, (result) => {
  var name = req.body.name;
  var image = {
        // add cloudinary public_id for the image to the campground object under image property
        id: result.public_id,
        // add cloudinary url for the image to the campground object under image property
        url: result.secure_url
      };
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  var menu = req.body.menu;
    var newCorner = {name: name, image: image, description: desc, menu: [menu], author:author};
    // Create a new corner and save to DB
    Corner.create(newCorner, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to corners page
            console.log(newlyCreated);
            res.redirect("/corners");
        }
    });
  });
});

//NEW - show form to create new corner
router.get("/new", isLoggedIn, function(req, res){
   res.render("corners/new"); 
});

// SHOW - shows more info about one corner
router.get("/:id", function(req, res){
    //find the corner with provided ID
    Corner.findById(req.params.id).populate("comments").exec(function(err, foundCorner){
        if(err || !foundCorner){
            console.log(err);
            req.flash('error', 'Sorry, that f-corner does not exist!');
            return res.redirect('/corners');
        }
        console.log(foundCorner)
        //render show template with that corner
        res.render("corners/show", {corner: foundCorner});
    });
});

// EDIT - shows edit form for a corner
var imageId, imageUrl;
router.get("/:id/edit", checkUserCorner, function(req, res){
  //render edit template with that corner
 Corner.findById(req.params.id, (err, foundCorner) => {
    imageId = foundCorner.image.id;
    imageUrl = foundCorner.image.url;
    if (err) { res.redirect("/corners") }
    else { res.render("corners/edit", { corner: foundCorner }); } 
  });
});


// PUT - updates corner in the database
router.put("/:id", checkUserCorner, upload.single('image'), (req, res) => {
	if(!req.file) {
	var image = {
        // add cloudinary public_id for the image to the campground object under image property
        id: imageId,
        // add cloudinary url for the image to the campground object under image property
        url: imageUrl
      };
	var	author= {
          id: req.user._id,
          username: req.user.username
        }
	var menu = req.body.menu;
    var newData = {name: req.body.name, image: image, description: req.body.description, menu: [menu], author: author};
    Corner.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, corner){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/corners/" + corner._id);
        }
    });
	}
	else {
		cloudinary.uploader.upload(req.file.path, (result) => {
        var image = {
          // add cloudinary public_id for the image to the campground object under image property
          id: result.public_id,
          // add cloudinary url for the image to the campground object under image property
          url: result.secure_url
        };
    cloudinary.uploader.destroy(imageId, (result) => { console.log(result) });
	var menu = req.body.menu;
	var	author= {
          id: req.user._id,
          username: req.user.username
        }
    var newData = {name: req.body.name, image: image, description: req.body.description, menu: [menu], author: author};
    Corner.findByIdAndUpdate(req.params.id, {$set: newData}, function(err, corner){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/corners/" + corner._id);
        }
    });
  });
	}
});

// DELETE - removes corner and its comments from the database
router.delete("/:id", isLoggedIn, checkUserCorner, function(req, res) {
    Comment.remove({
      _id: {
        $in: req.corner.comments
      }
    }, function(err) {
      if(err) {
          req.flash('error', err.message);
          res.redirect('/');
      } else {
          req.corner.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'F-Corner deleted!');
            res.redirect('/corners');
          });
      }
    })
});
// MENU Route

router.get("/:id/menu", function(req, res){
   Corner.findById(req.params.id, function(err, foundCorner){
        if(err || !foundCorner){
            console.log(err);
            req.flash('error', 'Sorry, that f-corner does not exist!');
            return res.redirect('/corners');
        }
        console.log(foundCorner)
        //render show template with that corner
        res.render("corners/menu", {corner: foundCorner});
    });
});

module.exports = router;