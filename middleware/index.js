var Comment = require('../models/comment');
var Corner = require('../models/corner');
module.exports = {
  isLoggedIn: function(req, res, next){
      if(req.isAuthenticated()){
          return next();
      }
      req.flash('error', 'You must be signed in to do that!');
      res.redirect('/login');
  },
  checkUserCorner: function(req, res, next){
    Corner.findById(req.params.id, function(err, foundCorner){
      if(err || !foundCorner){
          console.log(err);
          req.flash('error', 'Sorry, that f-corner does not exist!');
          res.redirect('/corners');
      } else if(foundCorner.author.id.equals(req.user._id) || req.user.isAdmin){
          req.corner = foundCorner;
          next();
      } else {
          req.flash('error', 'You don\'t have permission to do that!');
          res.redirect('/corners/' + req.params.id);
      }
    });
  },
  checkUserComment: function(req, res, next){
    Comment.findById(req.params.commentId, function(err, foundComment){
       if(err || !foundComment){
           console.log(err);
           req.flash('error', 'Sorry, that comment does not exist!');
           res.redirect('/corners');
       } else if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
            req.comment = foundComment;
            next();
       } else {
           req.flash('error', 'You don\'t have permission to do that!');
           res.redirect('/corners/' + req.params.id);
       }
    });
  },
  isAdmin: function(req, res, next) {
    if(req.user.isAdmin) {
      next();
    } else {
      req.flash('error', 'This site is now read only thanks to spam and trolls.');
      res.redirect('back');
    }
  },
}