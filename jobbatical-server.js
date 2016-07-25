var jobbaticalApp = require('./jobbatical-app');
// postgre DB urls, credentials are imported
var dbConfigurations = require('./configurations/dev-environment');
// set dev DB configuratons
jobbaticalApp.set('dbConfigurations', dbConfigurations);

//set the port
jobbaticalApp.set('port', process.env.PORT || 8282);

//Start the server
var jobbaticalServer = jobbaticalApp.listen(jobbaticalApp.get('port'), function() {
  console.log('Jobbatical Server is up and running on port ' + jobbaticalServer.address().port);
});
