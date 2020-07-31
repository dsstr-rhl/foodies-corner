var mongoose = require("mongoose");

var cornerSchema = new mongoose.Schema({
   name: String,
   image: {
    id: String,
    url: String
  },
   description: String,
   menu: [String],
   location: String,
   lat: Number,
   lng: Number,
   createdAt: { type: Date, default: Date.now },
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});

module.exports = mongoose.model("Corner", cornerSchema);