var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    passport    = require("passport"),
    cookieParser = require("cookie-parser"),
    LocalStrategy = require("passport-local"),
    flash        = require("connect-flash"),
	helmet         = require("helmet"),
    Corner  = require("./models/corner"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
    session = require("express-session"),
    seedDB      = require("./seeds"),
    methodOverride = require("method-override");
// configure dotenv
require('dotenv').config({path:'dsstr_rhl/.env'});

//requiring routes
var commentRoutes    = require("./routes/comments"),
    cornerRoutes = require("./routes/corners"),
	userRoute       = require("./routes/user"),
    indexRoutes      = require("./routes/index"),
	passwordRoute   = require("./routes/password");
    
// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

const databaseUri = "mongodb://dsstrrhl:dsstrrhl@foodies-corner-shard-00-00.xlrf9.mongodb.net:27017,foodies-corner-shard-00-01.xlrf9.mongodb.net:27017,foodies-corner-shard-00-02.xlrf9.mongodb.net:27017/foodies-corner?ssl=true&replicaSet=atlas-113a5q-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(databaseUri, { useMongoClient: true,
							   useNewUrlParser: true,
							  useUnifiedTopology: true})
      .then(() => console.log(`Database connected`))
      .catch(err => console.log(`Database connection error: ${err.message}`));

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));
app.use(helmet());
//require moment
app.locals.moment = require('moment');
// seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});


app.use("/", indexRoutes);
app.use("/corners", cornerRoutes);
app.use("/corners/:id/comments", commentRoutes);
app.use("/users", userRoute);
app.use("/", passwordRoute);


app.listen(process.env.PORT,process.env.IP, function(){
   console.log("server has started");
	console.log(process.env.PASSWORD);
	console.log(process.env.ADMIN_CODE);
	console.log(process.env.APISECRET);
});