//import required modules to start a server
//used for routing,writing middleware api,error handling
var express = require('express');
//used for api logging
var morganLog = require('morgan');
//used for parsing json data
var bodyParser = require('body-parser');
var path = require('path');
//used for routing the api
var jobbaticalUsers = require('./routing/jobbatical-users');


//initialize express api
var jobbaticalApi = express();
jobbaticalApi.use(bodyParser.json());
jobbaticalApi.use(bodyParser.urlencoded({extended: true}));
jobbaticalApi.use(morganLog('dev'));
jobbaticalApi.use('/', jobbaticalUsers);

//handle 500 error
jobbaticalApi.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render({
    message: err.message,
    error: {},
    title: 'error'
  });
});

//handle 404 error
jobbaticalApi.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = jobbaticalApi;
