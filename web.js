// web.js


var express = require("express");
var logfmt = require("logfmt");
var path = require('path');
var favicon = require('static-favicon');
//var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require("request");

var mongo = require('mongodb');

// trying to parse json out of the url... may not need all of these packages
var url = require('url');
var querystring = require('querystring');
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



app.use(logfmt.requestLogger());

//app.use('/', routes);
//app.use('/users', users);

app.get('/', function(req, res) {
  res.send("Ello chap. Get Rowdy.");
});

// default page to render at  basic url
app.get('/generate_test_map/*', function(req, res) {
/*
request({url: req.url,json: true}, function(err, resp, body) {
	    res.send(body);
	}
);
*/
/*
var input_query = url.parse(req.url).query;
var latitude = substr(input_query, input_query.indexof("&"));
var longitude = substr(input_qery, input_query.indexof("&"), input_qery.length);

res.send("Latitude: " + latitude + " Longitude: " + longitude);
*/

var url_json_return = querystring.parse(url.parse(req.url).query);


//res.send("Latitude: " + url_json_return.latitude + " Longitude: " + url_json_return.longitude);
res.send("Latitude: " + req.query.latitude + " Longitude: " + req.query.longitude);



  //res.send("Fucking miles says: " + url.parse(req.url).query + ".... fucking miles...");

  //var 	abcdefg = JSON.parse(url.parse(req.url).query);
  	//console.log(url.parse(req.url).query);
  	 //);
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

















