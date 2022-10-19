/**
 * Authentication & Authorization 
 * support 2FA (MFA), SSO.
 */
const CONF = require('../utils/conf');
const router = require('express').Router();
const asyncFn = require('../com');
// const joi = require('joi');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const MagicLinkStrategy = require('passport-magic-link').Strategy;
const BearerStrategy = require('passport-http-bearer').Strategy;
const oauth2orize = require('oauth2orize');
const login = require('connect-ensure-login');

const { Logger } = require('../utils/logger');
const logger = new Logger('RepoService');


passport.use(new LocalStrategy((email, password, cb) => {
   console.log('local');
   db.get('SELECT * FROM users WHERE email = ?', [ email ], function(err, user) {
     if (err) { return cb(err); }
     if (!user) { return cb(null, false, { message: 'Incorrect username or password.' }); }
 
     crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
       if (err) { return cb(err); }
       if (!crypto.timingSafeEqual(user.hashed_password, hashedPassword)) {
         return cb(null, false, { message: 'Incorrect username or password.' });
       }
       return cb(null, user);
     });
   });
 }));

passport.use(new BearerStrategy((token, done) => {
    User.findOne({ token: token }, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      return done(null, user, { scope: 'read' });
    });
  }
));

passport.use(new MagicLinkStrategy({
  secret: 'ap whildcat',
  userFields: [ 'email' ],
  tokenField: 'token',
  verifyUserAfterToken: true
}, function send(user, token) {
  var link = `${CONF.app.webapp_url}/reg/verify?token=${token}`;
  var msg = {
    to: user.email,
    from: CONF.app.email,
    subject: `Sign in to ${CONF.app.name}`,
    text: `Hello! Click the link below to finish signing in to ${CONF.app.name}.\r\n\r\n ${link}`,
    html: `<h3>Hello!</h3><p>Click the link below to finish signing in to Todos.</p><p><a href="${link}">Sign in</a></p>`,
  };
  console.log(msg);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("foo");
    }, 300);
  });
}, (user) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [
      user.email
    ], (err, row) => {
      if (err) { return reject(err); }
      if (!row) {
        db.run('INSERT INTO users (email, email_verified) VALUES (?, ?)', [
          user.email,
          1
        ], (err) => {
          if (err) { return reject(err); }
          var id = this.lastID;
          var obj = {
            id: id,
            email: user.email
          };
          return resolve(obj);
        });
      } else {
        return resolve(row);
      }
    });
  });
}));

passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    console.log('serializeUser');
    cb(null, { id: user.id, email: user.email });
  });
});

passport.deserializeUser((user, cb) => {
  process.nextTick(() => {
    console.log('deserializeUser');
    return cb(null, user);
  });
});

router.post('/auth/reg', passport.authenticate('magiclink', {
  action: 'requestToken',
  failureMessage: true,
  successMessage: true
}), (req, res, next) => {
  console.log('/auth/reg:', req.body);
  res.status(200).send({location:'/reg/echeck'});
});

router.get('/auth/reg/verify', passport.authenticate('magiclink', {
  failureMessage: true,
  successMessage: true
}), (req, res, next) => {
  console.log('/auth/reg/verify:', req.body);
  res.status(202);
});

router.post('/auth/ses', passport.authenticate('local', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/auth',
  failureMessage: true
}), (req, res, next) => {
  // console.log('/auth/ses:', req.body);
  res.status(200).send({location:'/'});
});

router.delete('/auth/ses', (req, res, next) => {
  // console.log('/auth/ses:', req.body);
  req.logout((err) => {
    if (err) { return next(err); }
    res.status(202);
  });
});



//OAuth 2.0, 
const server = oauth2orize.createServer();

server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient((id, done) => {
  db.clients.findById(id, (error, client) => {
    if (error) return done(error);
    return done(null, client);
  });
});

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
  var code = utils.uid(16);

  var ac = new AuthorizationCode(code, client.id, redirectURI, user.id, ares.scope);
  ac.save(function(err) {
    if (err) { return done(err); }
    return done(null, code);
  });
}));

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
  AuthorizationCode.findOne(code, function(err, code) {
    if (err) { return done(err); }
    if (client.id !== code.clientId) { return done(null, false); }
    if (redirectURI !== code.redirectUri) { return done(null, false); }

    var token = utils.uid(256);
    var at = new AccessToken(token, code.userId, code.clientId, code.scope);
    at.save(function(err) {
      if (err) { return done(err); }
      return done(null, token);
    });
  });
}));

router.get('/oauth/authorize',
  login.ensureLoggedIn(),
  server.authorize(function(clientID, redirectURI, done) {
    Clients.findOne(clientID, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.redirectUri != redirectURI) { return done(null, false); }
      return done(null, client, client.redirectURI);
    });
  }),
  function(req, res) {
    res.render('dialog', { transactionID: req.oauth2.transactionID,
                           user: req.user, client: req.oauth2.client });
});

router.post('/oauth/authorize/decision',
   login.ensureLoggedIn(),
   server.decision());

//OAuth 2.0 token exchange with HTTP Basic authentication header 
// or client credentials in the request body 
router.post('/oauth/token',
   passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
   server.token(),
   server.errorHandler());   

router.get('/userinfo', 
   passport.authenticate('bearer', { session: false }),
   function(req, res) {
     res.json(req.user);
   });

 

module.exports = router;