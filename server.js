var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cors = require('cors');
var dotenv = require('dotenv').config();
var SuperLogin = require('superlogin');
var { security } = require('superlogin/config/default.config');

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use(function(req, res, next) {
res.header("Access-Control-Allow-Origin", "*");
res.header('Access-Control-Allow-Methods', 'DELETE, PUT, OPTIONS,POST,GET');
res.header("Access-Control-Allow-Headers", "Authorization, Origin, X- Requested-With, Content-Type, Accept");
next();
});

var config = {
  security: {
    // Default roles given to a new user
    defaultRoles: ['user'],
    // Disables the ability to link additional providers to an account when set to true
    disableLinkAccounts: false,
    // Maximum number of failed logins before the account is locked
    maxFailedLogins: 3,
    // The amount of time the account will be locked for (in seconds) after the maximum failed logins is exceeded
    lockoutTime: 600,
    // The amount of time a new session is valid for (default: 24 hours)
    sessionLife: 604800, //172800, //86400,
    // The amount of time a password reset token is valid for
    tokenLife: 86400,
    // The maximum number of entries in the activity log in each user doc. Zero to disable completely
    userActivityLogSize: 10,
    // If set to true, the user will be logged in automatically after registering
    loginOnRegistration: true,
    // If set to true, the user will be logged in automatically after resetting the password
    loginOnPasswordReset: true
  },
  local: {
    emailUsername: true
  },
  dbServer: {
    protocol: 'https://',
    //host: '',
    //user: '',
    //password: '',
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    cloudant: true,
    userDB: 'all_users',
    couchAuthDB: '_users'
  },
  mailer: {
    fromEmail: 'gmail.user@gmail.com',
    options: {
      service: 'Gmail',
        auth: {
          user: 'gmail.user@gmail.com',
          pass: 'userpass'
        }
    }
  },
  userDBs: {
    defaultDBs: {
      private: ['dbings','dbproducts','dbsales','dbclients','dbexpenses','dbprodings','dbprodothers','dbsettings']
    }, 
    model: {
      // If your database is not listed below, these default settings will be applied
       _default: {
         // Array containing name of the design doc files (omitting .js extension), in the directory configured below
         designDocs: ['mydesign'],
         // these permissions only work with the Cloudant API
         permissions: ['_reader', '_replicator','_writer']
       },
       dbings: {
         designDocs: ['dbings'],
         permissions: ['_reader', '_replicator','_writer'],
         // 'private' or 'shared'
         type: 'private',
         // Roles that will be automatically added to the db's _security object of this specific db
         adminRoles: ["superadmin"],
         memberRoles: ["user"]
       },
       dbproducts: {
        designDocs: ['dbproducts'],
        permissions: ['_reader', '_replicator','_writer'],
        // 'private' or 'shared'
        type: 'private',
        // Roles that will be automatically added to the db's _security object of this specific db
        adminRoles: ["superadmin"],
        memberRoles: ["user"]
      },
      dbsales: {
        designDocs: ['dbsales'],
        permissions: ['_reader', '_replicator','_writer'],
        // 'private' or 'shared'
        type: 'private',
        // Roles that will be automatically added to the db's _security object of this specific db
        adminRoles: ["superadmin"],
        memberRoles: ["user"]
      },
      dbclients: {
        designDocs: ['dbclients'],
        permissions: ['_reader', '_replicator','_writer'],
        // 'private' or 'shared'
        type: 'private',
        // Roles that will be automatically added to the db's _security object of this specific db
        adminRoles: ["superadmin"],
        memberRoles: ["user"]
      },
      dbexpenses: {
        designDocs: ['dbexpenses'],
        permissions: ['_reader', '_replicator','_writer'],
        // 'private' or 'shared'
        type: 'private',
        // Roles that will be automatically added to the db's _security object of this specific db
        adminRoles: ["superadmin"],
        memberRoles: ["user"]
      },
      dbprodings: {
        designDocs: ['dbprodings'],
        permissions: ['_reader', '_replicator','_writer'],
        // 'private' or 'shared'
        type: 'private',
        // Roles that will be automatically added to the db's _security object of this specific db
        adminRoles: ["superadmin"],
        memberRoles: ["user"]
      },
      dbprodothers: {
        designDocs: ['dbprodothers'],
        permissions: ['_reader', '_replicator','_writer'],
        // 'private' or 'shared'
        type: 'private',
        // Roles that will be automatically added to the db's _security object of this specific db
        adminRoles: ["superadmin"],
        memberRoles: ["user"]
      },
      dbsettings: {
        designDocs: ['dbsettings'],
        permissions: ['_reader', '_replicator','_writer'],
        // 'private' or 'shared'
        type: 'private',
        // Roles that will be automatically added to the db's _security object of this specific db
        adminRoles: ["superadmin"],
        memberRoles: ["user"]
      }
     },
  }
}

// Initialize SuperLogin
var superlogin = new SuperLogin(config);

// Mount SuperLogin's routes to our app
app.use('/auth', superlogin.router);

app.use('/logoutSession',
  function(req, res) {
    try{
      superlogin.logoutSession(req.body.session_id).then(function(data){
        res.send(data);
      }).catch(function(err){
        res.send(err);
      });
    }catch(err){
      console.log(err);
    }
  });

  app.use('/testpage',
  function(req, res) {
    res.send("Welcome here! " + process.env.TESTING);
  });

  app.use('/checkUsername',
      function(req, res) {
        try{
        superlogin.validateUsername(req.body.username).then(function(data){
          res.send(data);
        }).catch(function(err){
          res.send(err);
        });
      }catch(err){
        console.log(err);
      }
  });

  app.use('/checkEmailUsername',
      function(req, res) {
        try{
        superlogin.validateEmailUsername(req.body.email).then(function(data){
          res.send(data);
        }).catch(function(err){
          res.send(err);
        });
      }catch(err){
        console.log(err);
      }
  });

  app.use('/getUser',
  function(req, res) {
    try{
      superlogin.getUser(req.body.login).then(function(data){
        res.send(data);
      }).catch(function(err){
        res.send(err);
      });
    }catch(err){
      console.log(err);
    }
  });

  app.use('/removeexpiredkeys',
  function(req, res) {
    try{
      superlogin.removeExpiredKeys().then(function(data){
        res.send(data);
      }).catch(function(err){
        res.send(err);
      });
    }catch(err){
      console.log(err);
    }
  });

http.createServer(app).listen(app.get('port'));
