var jobbaticalApp = require('../jobbatical-app');
var fs = require('fs');
var request = require('supertest');
var Pool = require('pg-pool');
var chai = require('chai');
var expect = chai.expect;
var async = require('async');
var dbConfigurations = require('../configurations/test-environment');

// set test DB configuratons for app
jobbaticalApp.set('dbConfigurations', dbConfigurations);

//get test data query for test suite
var allSqlQueries;
function getTestDataSQLQueries() {
  var promise = new Promise(function(resolve, reject){
    async.map(['./sql/users-data.sql','./sql/companies-data.sql','./sql/teams-data.sql','./sql/listings-data.sql','./sql/applications-data.sql'],
    function(item, callNext){
      fs.readFile(item,'utf8', function(err, res){
        if(err){
          callNext(err);
        }
        if(res){
          callNext(null, res);
        }
      });
    },
    function(err, results){
      if(err){
        console.log("Error while reading a sql file: " + err);
        reject(err);
      }
      if(results){
        allSqlQueries = results;
      }
      resolve("imported all sql query data");
    });
  });
  return promise;
}

//flush database before running test suite
function flushDB() {
  var promise = new Promise(function(resolve, reject){
    var pgPool = new Pool(dbConfigurations);
    pgPool.connect(function (err, client, close) {
      if (err) {
        close();
        reject(err);
      }
      function truncateCascadedTable(tableName, next) {
        client.query("TRUNCATE TABLE " + tableName + " RESTART IDENTITY CASCADE").on('end',next);
      }
      async.series([function (next) {
        truncateCascadedTable('users', next)
      }, function (next) {
        truncateCascadedTable('companies', next)
      }, function (next) {
        truncateCascadedTable('teams', next)
      }, function (next) {
        truncateCascadedTable('listings', next)
      }, function (next) {
        truncateCascadedTable('applications', next)
      }], function () {
        close();
        resolve("-> Jobbatical test database successfully flushed");
      });
    })
  });
  return promise;
}
function setUpTestData(){
  var promise = new Promise(function(resolve,reject){
    var pgPool = new Pool(dbConfigurations);
    pgPool.connect(function(err, client, close){
      if(err){
        console.log(err);
        close();
        reject(err);
      }
      function insertTestData(data, next){
        client.query(data, function(err, res){
          if(err){
            console.log('insertion ended with error: ' + err);
            next(err);
          }
          if(res){
            console.log('inserted successfully');
            next(null, res);
          }
        });
      }

      async.series([
          function(next) {
              insertTestData(allSqlQueries[0], next);
          },
          function(next) {
              insertTestData(allSqlQueries[1], next);
          },
          function(next) {
              insertTestData(allSqlQueries[2], next);
          },
          function(next) {
              insertTestData(allSqlQueries[3], next);
          },
          function(next) {
              insertTestData(allSqlQueries[4], next);
          }
      ],
      function(err, results) {
        close();
        resolve("-> Jobbatical test data was successfully imported");
      });

    });
  });
  return promise;

}
beforeEach(function(){
  return getTestDataSQLQueries().then(function(res){
    console.log(res);
    return flushDB().then(function(res){
      console.log(res);
      return setUpTestData().then(function(res){
        console.log(res);
        return res;
      });
    });
  });
});
describe('Active Users API', function () {
  describe('GET /topActiveUsers', function () {
    it('should return first 10 Top Active Users', function (done) {
      request(jobbaticalApp)
        .get('/topActiveUsers')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Array);
          expect(res.body).to.have.length(10);
          done();
        })
    });

    it('should return Top Active Users for current page', function (done) {
      request(jobbaticalApp)
        .get('/topActiveUsers?page=2')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) return done(err);
          expect(res.body).to.be.instanceOf(Array);
          expect(res.body).to.have.length(10);
          done();
        })
    });
  });

  describe('User Details API', function () {
    describe('GET /users?id=userId', function () {
      it('should return the full details of the user', function (done) {
        var testUserDetails = {"id":10,"name":"Ramya",
                                "companies":[{
                                  "id":9,
                                  "name":"Cadbury & Co",
                                  "isContact":true}],
                                "createdListings":[{
                                  "id":10,
                                  "name":"10 Join us conquering the world!",
                                  "description":"This is your best chance to be on the right side of the equation..."}],
                                "applications":[{
                                  "id":12,"coverLetter":"12 Hello, ...",
                                  "listing":{
                                    "id":14,
                                    "name":"14 Join us conquering the world!",
                                    "description":"This is your best chance to be on the right side of the equation..."}}]
                                  };
        request(jobbaticalApp)
          .get('/users?id=' + testUserDetails.id)
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function (err, res) {
            if (err) return done(err);
            var userDetails = res.body;
            //user details
            expect(userDetails).to.be.instanceOf(Object);
            expect(userDetails.id).to.equal(testUserDetails.id);
            expect(userDetails.name).to.equal(testUserDetails.name);
            expect(userDetails.createdAt).to.be.present;

            //associated company details
            expect(userDetails.companies).to.be.instanceOf(Array);
            expect(userDetails.companies).to.have.length(1);
            expect(userDetails.companies.name).to.equal(testUserDetails.companies.name);
            expect(userDetails.companies.isContact).to.equal(testUserDetails.companies.isContact);

            //associated listings created
            expect(userDetails.createdListings).to.be.instanceOf(Array);
            expect(userDetails.createdListings).to.have.length(1);
            expect(userDetails.createdListings.name).to.equal(testUserDetails.createdListings.name);
            expect(userDetails.createdListings.description).to.equal(testUserDetails.createdListings.description);

            //associated applications
            expect(userDetails.applications).to.be.instanceOf(Array);
            expect(userDetails.applications).to.have.length(1);

            done();
          })
      });
    });
  });
});
