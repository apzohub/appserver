/**
 * Authentication & Authorization 
 * support 2FA (MFA), SSO.
 */
const CONF = require('../utils/conf');
const asyncFn = require('../com');
const router = require('express').Router();
const {StatusCodes} = require('http-status-codes');

// const joi = require('joi');
const { Entity, User } = require('../model/entity');
const { RepoService } = require('./persistent');
const {IdGen} = require('../utils/id');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const BearerStrategy = require('passport-http-bearer').Strategy;
const oauth2orize = require('oauth2orize');
const login = require('connect-ensure-login');



const { Logger } = require('../utils/logger');
const logger = new Logger('RepoService');

const rs = new RepoService(User);


passport.use(new LocalStrategy((email, password, cb) => {
   logger.debug('local');
   rs.find("email=$1", [ email ], function(err, user) {
     if (err) { return cb(err); }
     if (!user) { return cb(null, false, { message: 'Invalid email or password.' }); }
 
     crypto.pbkdf2(password, user.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
       if (err) { return cb(err); }
       if (!crypto.timingSafeEqual(user.hashed_password, hashedPassword)) {
         return cb(null, false, { message: 'Invalid email or password.' });
       }
       return cb(null, user);
     });
   });
 }));

passport.use(new BearerStrategy((token, done) => {
    logger.debug('tkn', token);
    let data = IdGen.jwt_verify(token);
    rs.find("email=$1", [data['email']]).then((exusr) => {
      if(exusr.length > 0 && exusr[0].state == Entity.ACTIVE) {
        exusr = exusr[0];
        //res.status(StatusCodes.OK).send({email: exusr.email});
        done(null, exusr, { scope: 'read' });
      }else
        done(null, false);
        // res.status(StatusCodes.UNAUTHORIZED);
    }).catch(err => {
      logger.error(err);
      //res.status(StatusCodes.UNAUTHORIZED);
      done(err);
    });
  }
));

passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    logger.debug('serializeUser');
    cb(null, { id: user.id, email: user.email });
  });
});

passport.deserializeUser((user, cb) => {
  process.nextTick(() => {
    logger.debug('deserializeUser');
    return cb(null, user);
  });
});

router.post('/auth/reg', (req, res, next) => {
  logger.debug('/auth/reg:', req.body);
  let user = req.body;
  console.log('user: ', user, user.email)
  rs.find("email=$1", [user.email]).then((exusr) => {
    logger.info('exusr: ',exusr); 
    if(exusr.length == 0) {
      const exusr = new User(user.email, user.password, {chk: 0});
      rs.create(exusr).then((ret) => {
          logger.debug(`created: ${JSON.stringify(ret)}`);
          const token = IdGen.jwt({email: user.email});
          const link = `${CONF.app.webapp_url}/reg/verify?token=${token}`;
          const msg = {
            to: user.email,
            from: CONF.app.email,
            subject: `Sign in to ${CONF.app.name}`,
            text: `Hello! Click the link below to finish signing in to ${CONF.app.name}.\r\n\r\n ${link}`,
            html: `<h3>Hello!</h3><p>Click the link below to finish signing in to Todos.</p><p><a href="${link}">Sign in</a></p>`,
          };
          console.log(msg);
          res.status(StatusCodes.OK).send({location:'/reg/echeck'});
      }).catch(err => {
        logger.error(err);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR)
      });
    }else{
      res.status(StatusCodes.BAD_REQUEST).send({err: "That user already exists!"});
    }
  }).catch(err => {
    logger.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
  });
  res.status(StatusCodes.BAD_REQUEST);
});

router.get('/auth/reg/verify', (req, res, next) => {
  logger.debug('/auth/reg/verify:', req.query, req.query['token']);
  let data = IdGen.jwt_verify(req.query['token']);
  rs.find("email=$1", [data['email']]).then((exusr) => {
    if(exusr.length > 0) {
      exusr = exusr[0];
      if(typeof exusr['kv']['chk'] == undefined) {
        res.status(StatusCodes.BAD_REQUEST).send({err: "Invalid user!"});
        return;
      }
      if(exusr['kv']['chk'] != 0) {
        res.status(StatusCodes.BAD_REQUEST).send({err: "That user already exists!"});
        return;
      }
      exusr['kv']['chk']=1;
      exusr.state = Entity.ACTIVE;
      rs.update(exusr).then(ret => {
        res.status(202);
      }).catch(err => res.status(StatusCodes.INTERNAL_SERVER_ERROR));
    }else{
      res.status(StatusCodes.BAD_REQUEST).send({err: "Invalid user!"});
    }  
  });
  
});

router.post('/auth/ses', passport.authenticate('local', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/auth',
  failureMessage: true
}), (req, res, next) => {
  logger.debug('/auth/ses:', req.body);
  //res.status(StatusCodes.OK).send({location:'/'});
});

router.delete('/auth/ses', (req, res, next) => {
  logger.debug('/auth/ses:', req.body);
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