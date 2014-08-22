// web.js


var express = require("express");
var logfmt = require("logfmt");
var path = require('path');
var favicon = require('static-favicon');
//var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongo = require('mongodb');

var isochrones = require('./isochrones_Copy');

// include the code Miles wrote so we can use his function
// var isochrone = require('');

// fun timer for log. timer.log() to use
var timer = logfmt.time('time');



// trying to parse json out of the url... may not need all of these packages
//var url = require('url');
//var querystring = require('querystring');

// express-specific answer that makes the above libaries unnecessary -
// http://stackoverflow.com/questions/6912584/how-to-get-get-query-string-variables-in-node-js?rq=1

// this first section was (part of) how to hook up to local mongodb
/*var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/tutorial3data');
*/


// see this link for extremely brief tutorial on setting up mongodb with heroku/node - this may not use monk
// https://devcenter.heroku.com/articles/getting-started-with-nodejs#using-mongodb

var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

  // this works, but inserts a dummy record. mimic this if you want to do shit
/*
mongo.Db.connect(mongoUri, function (err, db) {
  db.collection('mydocs', function(er, collection) {
    collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {  });
  });
});
*/



var app = express();


// not exactly sure what this does, it is from heroku nodejs tutorial / getting started
app.use(logfmt.requestLogger());

// use miles's code?
//app.use()


// default page to render at  basic url
app.get('/', function(req, res) {
  res.send("Ello chap. Get Rowdy.");
});

// testing JSON creation using Lat-Long
app.get('/generate_test_map/*', function(req, res) {

// the below two lines are one way to do url parsing to JSON if you aren't using express
//var url_json_return = querystring.parse(url.parse(req.url).query);
//res.send("Latitude: " + url_json_return.latitude + " Longitude: " + url_json_return.longitude);

// extremely simple error checking here - only print lat/long if those are in the query
if (req.query.hasOwnProperty('latitude') && req.query.hasOwnProperty('longitude') )
   {
   	// try writing to the log the lat/long searched for, and time how long it takes to
   	// run the function on those coordinates and return something.

   	// console.log instead - individual session see the data in browser
   	 logfmt.log({latitude: req.query.latitude, longitude: req.query.longitude});
   	 timer.log();

   	 // Where the magic happens
     res.send("Latitude: " + req.query.latitude + " Longitude: " + req.query.longitude);

     timer.log();
   }
else
   {
	 res.send("You broked it cuz you didn't give latitude and longitude. check spelling/case of keys");
   }
});


// Set view engine to html files in the /views/ directory. Path.join makes
// it environment independent ('/' vs '\')
app.set('views', path.join(__dirname, '/views'));

// Not sure why/how etc. but 'ejs' is what lets you use html files
app.engine('html', require('ejs').renderFile);

// this was for local running, with jade files. Not needed using ember and HTML
//app.set('view engine', 'jade');

// navigate to {default url}/basic_google_map and render basic_google_map.html
app.get('/basic_google_map', function(req, res) {
  //var testIsochroneA = createIsochrone([-83.751, 42.281], 20, "walk");
  //res.send(testIsochroneA);
  //res.render('basic_google_map.html');
  res.send("Hello.");
  


});




// This is for heroku, don't change the port
var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
  console.log("Listening on " + port);
});


