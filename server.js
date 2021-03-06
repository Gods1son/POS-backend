var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cors = require('cors');
var dotenv = require('dotenv').config();
var PouchDB = require('pouchdb');
var SuperLogin = require('superlogin');
var { security } = require('superlogin/config/default.config');
const Stripe = require('stripe');
const stripe = Stripe(process.env.stripeKey);

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
      private: ['dbings','dbproducts','dbsales','dbclients','dbexpenses','dbrestock','dbprodings','dbprodothers','dbsettings']
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
    const{v4: uuidv4} = require("uuid");
    var id = uuidv4();
    res.send("Welcome here! " + id);
  });

  app.use('/testQuery',
  function(req, res) {
    res.send("Value: " + req.query.value);
  });

  app.use('/testCloudPage',
  function(req, res) {
    var db = new PouchDB('https://' + process.env.USER + ':' + process.env.PASSWORD + '@' + process.env.HOST + '/pages');
    db.info().then(function (info) {
      res.send(info);
    }).catch((err) => {
      res.send(err);
    })
    //res.send("Value: " + req.query.value);
  });

  app.use('/addNewPage',
  function(req, res) {
    
    var doc = req.body;
    var db = new PouchDB('https://' + process.env.USER + ':' + process.env.PASSWORD + '@' + process.env.HOST + '/pages');
    if(doc._id == undefined || doc._id == null){
      const{v4: uuidv4} = require("uuid");
      var idUnique = uuidv4();
      doc._id = idUnique;
      db.put(doc).then(function(rec){
        db.get(doc._id).then(function(data){
          res.send(data);
        })
      }).catch((err) => {
        res.send(err);
      })
    }else{
        db.get(doc._id).then(function(data){
          var data2 = data;
          data = doc;
          data._id = data2._id;
          data._rev = data2._rev;
          db.put(data).then((fin) => {
            res.send(fin);
          })
        }).catch((err) => {
        res.send(err);
      })
    }
    
    /*
    var db = new PouchDB('https://' + process.env.USER + ':' + process.env.PASSWORD + '@' + process.env.HOST + '/pages');
    var doc = {};
    const{v4: uuidv4} = require("uuid");
    var idUnique = uuidv4();
    doc._id = idUnique;
    doc.store_name = "store tester";
    doc.product_name = "product hair 2";
    doc.description = "this is a beautiful hair to purchase";
    doc.other_notes = "It is yellow and straight";
    db.put(doc).then(function(rec){
      db.get(doc._id).then(function(data){
        res.send(data);
      })
    }).catch((err) => {
      res.send(err);
    })*/
    //res.send("Value: " + req.query.value);
  });

  app.use('/returnPage',
  function(req, res) {
    console.log(req.body);
    var link = req.body.id;
    if(link == undefined || link == null){
      console.log("no link");
      res.send(null);
      return;
    }
    var db = new PouchDB('https://' + process.env.USER + ':' + process.env.PASSWORD + '@' + process.env.HOST + '/pages');
      db.get(link).then(function(data){
        data.successCode = true;
        res.send(data);
      }).catch((err) => {
        console.log("error:", err);
        err.successCode = false;
        res.send(err);
    })
  })


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

  //stripe integration
  app.use(
    '/stripe-webhook',
    bodyParser.raw({ type: 'application/json' }),
    async (req, res) => {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
  
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          req.headers['stripe-signature'],
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      // Extract the object from the event.
      const dataObject = event.data.object;

      // https://stripe.com/docs/billing/webhooks
      // Remove comment to see the various objects sent for this sample
      switch (event.type) {
        case 'invoice.paid':
          // Used to provision services after the trial has ended.
          // The status of the invoice will show up as paid. Store the status in your
          // database to reference when a user accesses your service to avoid hitting rate limits.
          break;
        case 'invoice.payment_failed':
          // If the payment fails or the customer does not have a valid payment method,
          //  an invoice.payment_failed event is sent, the subscription becomes past_due.
          // Use this webhook to notify your user that their payment has
          // failed and to retrieve new card details.
          break;
        case 'invoice.finalized':
          // If you want to manually send out invoices to your customers
          // or store them locally to reference to avoid hitting Stripe rate limits.
          break;
        case 'customer.subscription.deleted':
          if (event.request != null) {
            // handle a subscription cancelled by your request
            // from above.
          } else {
            // handle subscription cancelled automatically based
            // upon your subscription settings.
          }
          break;
        case 'customer.subscription.trial_will_end':
          if (event.request != null) {
            // handle a subscription cancelled by your request
            // from above.
          } else {
            // handle subscription cancelled automatically based
            // upon your subscription settings.
          }
          break;
        default:
        // Unexpected event type
      }
      res.sendStatus(200);
    }
  );

  app.use('/createStripeUser',
  async function(req, res) {
    try{
      const customer = await stripe.customers.create({
        name: req.body.email,
        email: req.body.email
      });
      //console.log(customer);
      res.send(customer);
    }catch(err){
      console.log(err);
    }
  });

  app.use('/create-subscription', async (req, res) => {
    // Attach the payment method to the customer
    try {
      await stripe.paymentMethods.attach(req.body.paymentMethodId, {
        customer: req.body.customerId,
      });
    } catch (error) {
      return res.status('402').send({ error: { message: error.message } });
    }
  
    // Change the default invoice settings on the customer to the new payment method
    await stripe.customers.update(
      req.body.customerId,
      {
        invoice_settings: {
          default_payment_method: req.body.paymentMethodId,
        },
      }
    );
  
    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: req.body.customerId,
      items: [{ price: process.env.priceId}],
      expand: ['latest_invoice.payment_intent'],
    });
  
    res.send(subscription);
  });

  app.use('/retry-invoice', async (req, res) => {
    // Set the default payment method on the customer
  
    try {
      await stripe.paymentMethods.attach(req.body.paymentMethodId, {
        customer: req.body.customerId,
      });
      await stripe.customers.update(req.body.customerId, {
        invoice_settings: {
          default_payment_method: req.body.paymentMethodId,
        },
      });
    } catch (error) {
      // in case card_decline error
      return res
        .status('402')
        .send({ result: { error: { message: error.message } } });
    }
  
    const invoice = await stripe.invoices.retrieve(req.body.invoiceId, {
      expand: ['payment_intent'],
    });
    res.send(invoice);
  });

  app.use('/cancel-subscription', async (req, res) => {
    // Delete the subscription
    const deletedSubscription = await stripe.subscriptions.del(
      req.body.subscriptionId
    );
    res.send(deletedSubscription);
  });

  app.use('/check-subscription', async (req, res) => {
    // Delete the subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: req.body.customer,
      limit:3
    });
    
    var retObj = subscriptions.data.filter(x => x.customer == req.body.customer);
    res.send(retObj);
  });

  app.use('/retrieve-customer-payment-method', async (req, res) => {
    const paymentMethod = await stripe.paymentMethods.retrieve(
      req.body.paymentMethodId
    );
  
    res.send(paymentMethod);
  });

  app.use('/getStripeUserByEmail',
  async function(req, res) {
    try{
      const customers = await stripe.customers.list({
        email: req.body.email,
        limit: 3,
      });
      var retObj = customers.data.filter(x => x.email == req.body.email);
      res.send(retObj);
    }catch(err){
      console.log(err);
    }
  });

  app.use('/getStripeUser',
  async function(req, res) {
    try{
      const customer = await stripe.customers.retrieve(
        'cus_HonXWLstpCth7M'
      );
      //console.log(customer);
      res.send(customer);
    }catch(err){
      console.log(err);
    }
  });

  app.use('/createStripeProduct',
  async function(req, res) {
    try{
      const product = await stripe.products.create({
        name: 'Tea Special',
      });
      //console.log(customer);
      res.send("Product " + JSON.stringify(product));
    }catch(err){
      console.log(err);
    }
  });

  app.use('/createStripePrice',
  async function(req, res) {
    try{
      const price = await stripe.prices.create({
        unit_amount: 2000,
        currency: 'cad',
        product: 'prod_HonkeyuAsQNH5U'
      });
      //console.log(customer);
      res.send("Product " + JSON.stringify(price));
    }catch(err){
      console.log(err);
    }
  });

  app.use('/createStripeSession',
  async function(req, res) {
    try{
      const sessionStripe = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'T-shirt',
            },
            unit_amount: 2000,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://example.com/cancel',
      });
      //console.log(customer);
      res.send("Session: " + JSON.stringify(sessionStripe));
    }catch(err){
      console.log(err);
    }
  });

http.createServer(app).listen(app.get('port'));

