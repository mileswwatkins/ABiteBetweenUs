// web.js


var express = require("express");
var logfmt = require("logfmt");
var path = require('path');
var favicon = require('static-favicon');
//var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongo = require('mongodb');

var url = require('url');

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

mongo.Db.connect(mongoUri, function (err, db) {
  db.collection('mydocs', function(er, collection) {
    collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {  });
  });
});



var app = express();



app.use(logfmt.requestLogger());

//app.use('/', routes);
//app.use('/users', users);

// default page to render at  basic url
app.get('/hello/*', function(req, res) {
  res.send("Fucking miles says: " + url.parse(req.url).pathname + ".... fucking miles...");
  //res.render('basic_google_map.html');
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
  res.render('basic_google_map.html');
});

// This is for heroku, don't change the port
var port = Number(process.env.PORT || 5000);

app.listen(port, function() {
  console.log("Listening on " + port);
});

















