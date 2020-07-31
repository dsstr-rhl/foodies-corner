const express = require("express");
const router  = express.Router({mergeParams: true});
const Corner = require("../models/corner");
const Comment = require("../models/comment");
const middleware = require("../middleware");
const { isLoggedIn, checkUserComment, isAdmin } = middleware;

//Comments New
router.get("/new", isLoggedIn, function(req, res){
    // find corner by id
    console.log(req.params.id);
    Corner.findById(req.params.id, function(err, corner){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {corner: corner});
        }
    })
});

//Comments Create
router.post("/", isLoggedIn, function(req, res){
   //lookup corner using ID
   Corner.findById(req.params.id, function(err, corner){
       if(err){
           console.log(err);
           res.redirect("/corners");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               corner.comments.push(comment);
               corner.save();
               console.log(comment);
               req.flash('success', 'Created a comment!');
               res.redirect('/corners/' + corner._id);
           }
        });
       }
   });
});

router.get("/:commentId/edit", isLoggedIn, checkUserComment, function(req, res){
  res.render("comments/edit", {corner_id: req.params.id, comment: req.comment});
});

router.put("/:commentId", checkUserComment, function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
       if(err){
          console.log(err);
           res.render("edit");
       } else {
           res.redirect("/corners/" + req.params.id);
       }
   }); 
});

router.delete("/:commentId", isLoggedIn, checkUserComment, function(req, res){
  // find corner, remove comment from comments array, delete comment in db
  Corner.findByIdAndUpdate(req.params.id, {
    $pull: {
      comments: req.comment.id
    }
  }, function(err) {
    if(err){ 
        console.log(err)
        req.flash('error', err.message);
        res.redirect('/');
    } else {
        req.comment.remove(function(err) {
          if(err) {
            req.flash('error', err.message);
            return res.redirect('/');
          }
          req.flash('error', 'Comment deleted!');
          res.redirect("/corners/" + req.params.id);
        });
    }
  });
});

module.exports = router;