// web.js
var express = require("express");
var logfmt = require("logfmt");
var path = require('path');
var favicon = require('static-favicon');
//var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// this first section was (part of) how to hook up to local mongodb
/*var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/tutorial3data');

// see this link for extremely brief tutorial on setting up mongodb with heroku/node - this may not use monk
// https://devcenter.heroku.com/articles/getting-started-with-nodejs#using-mongodb
var mongo = require('mongodb');
var mongoUri = process.env.MONGOLAB_URI ||
  process.env.MONGOHQ_URL ||
  'mongodb://localhost/mydb';

mongo.Db.connect(mongoUri, function (err, db) {
  db.collection('mydocs', function(er, collection) {
    collection.insert({'mykey': 'myvalue'}, {safe: true}, function(er,rs) {
    });
  });
});

*/

var app = express();



app.use(logfmt.requestLogger());

//app.use('/', routes);
//app.use('/users', users);


app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.set('views', path.join(__dirname, 'utilities'));
app.set('view engine', 'html');

app.get('/basic_google_map', function(req, res) {
  res.render('basic_google_map');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});