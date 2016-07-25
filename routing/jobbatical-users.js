var express = require('express');
var router = express.Router();
var Pool = require('pg-pool');
var async = require('async');
var fs = require('fs');

function getSQLQueryData(fileName) {
  return fs.readFileSync('./sql/' + fileName + '.sql', 'utf8');
}

var sql = {
  getTopActiveUsers: getSQLQueryData('active-users'),
  getUserDetails: getSQLQueryData('user-details')
};

//get top active users
router.get('/topActiveUsers', function (req, res) {
  var jobbaticalApp = req.app;
  var dbConfigurations = jobbaticalApp.get('dbConfigurations');
  var pool = new Pool(dbConfigurations);
  pool.connect(function (err, client, done) {
    if (err) {
      res.status(500);
      return res.json({
        message: 'error connecting to DB',
        error: {},
        title: 'error'
      })
    }
    var pageNumber = parseInt(req.query.page) || 1;
    var maxCount = 10;//maximum records per page
    var pageIndex = (pageNumber - 1) * maxCount;

    var query = sql.getTopActiveUsers.replace('{maxCount}', maxCount).replace('{pageIndex}', pageIndex);

    client.query(query, function (err, results) {
      if (err) {
        console.log(err);
        res.status(500);
        return res.json({
          message: 'error querying data',
          error: {},
          title: 'error'
        })
      }
      res.json(results.rows);
    });

  });
});

//get user details
router.get('/users', function (req, res) {
  var jobbaticalApp = req.app;
  var dbConfigurations = jobbaticalApp.get('dbConfigurations');
  var pool = new Pool(dbConfigurations);
  pool.connect(function (err, client, done) {
    if (err) {
      res.status(500);
      return res.json({
        message: 'Error connecting to DB',
        error: {},
        title: 'error'
      })
    }
    var userId = req.query.id;
    var query = sql.getUserDetails.replace('{id}', userId);

    client.query(query, function (err, results) {
      if (err) {
        console.log(err);
        res.status(500);
        return res.json({
          message: 'error querying data',
          error: {},
          title: 'error'
        })
      }
      var userDetails;
      var companies = [];
      var createdListings = [];
      var applications = [];
      if(results.rows && results.rows[0]){
        userDetails = {'id':results.rows[0].userid, 'name':results.rows[0].username, 'createdAt':results.rows[0].usercreatedat};
      }
      results.rows.map(function(val,key){
        var company = {'id':val.companyid, 'name':val.companyname, 'createdAt':val.companycreatedat, 'isContact':val.companyiscontact};
        var createdListing = {'id':val.createdlistingid, 'name':val.createdlistingname, 'createdAt':val.createdlistingcreatedat, 'description':val.createdlistingdescription};
        var application = {'id':val.applicationid, 'createdAt':val.applicationcreatedat, 'coverLetter':val.applicationcoverletter};
        application.listing = {'id':val.applicationlistingid, 'name':val.applicationlistingname, 'description':val.applicationlistingdescription};
        companies.push(company);
        createdListings.push(createdListing);
        applications.push(application);
      })
      userDetails.companies = companies;
      userDetails.createdListings = createdListings;
      userDetails.applications = applications;
      res.json(userDetails);
    });


  });
});

module.exports = router;
