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
const { IdGen } = require('../utils/id');

const crypto = require('crypto');
const passport = require('passport');
const oauth2orize = require('oauth2orize');
const login = require('connect-ensure-login');

const { Logger } = require('../utils/logger');
const logger = new Logger('RepoService');

const rs = new RepoService(User);

router.post('/auth/reg', (req, res, next) => {
  logger.debug('/auth/reg:', req.body);
  let user = req.body;
  console.log('user: ', user, user.email)
  rs.find("email=$1", [user.email]).then((exusr) => {
    logger.info('exusr: ',exusr); 
    if(exusr.length == 0) {
      const salt=crypto.randomBytes(16); //random and at least 16 bytes - NIST SP 800-132
      crypto.pbkdf2(user.password, salt, 310000, 32, 'sha256', (err, derivedKey) => {
        if(err) throw err;
        const exusr = new User(user.email, derivedKey, salt, {chk: 0});
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
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send()
        });
      });
    }else{
      res.status(StatusCodes.BAD_REQUEST).send({err: "That user already exists!"});
    }
  }).catch(err => {
    logger.error(err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
  });
});

//FIXME: subject
router.get('/auth/reg/verify', (req, res, next) => {
  logger.debug('/auth/reg/verify:', req.query, req.query['token']);
  IdGen.jwt_averify(req.query['token'], (err, sub) => {
    if(err){
      if(err.name == 'TokenExpiredError')
        res.status(StatusCodes.BAD_REQUEST).send({err: 'Linke has expired!'});
      else res.sendStatus(StatusCodes.BAD_REQUEST);
      return;
    }
    rs.find("email=$1", [sub['email']]).then((exusr) => {
      if(exusr.length > 0) {
        exusr = exusr[0];
        if(typeof exusr['kv']['chk'] == undefined) {
          res.status(StatusCodes.BAD_REQUEST).send({err: "Invalid request!"});
          return;
        }
        if(exusr['kv']['chk'] != 0) {
          res.status(StatusCodes.BAD_REQUEST).send({err: "That user already exists!"});
          return;
        }
        exusr['kv']['chk']=1;
        exusr.state = Entity.ACTIVE;
        rs.update(exusr).then(ret => {
          res.status(202).send();
        }).catch(err => {
          logger.error(err);
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send()
        });
      }else{
        res.status(StatusCodes.BAD_REQUEST).send({err: "Invalid request!"});
      }  
    });
  });
  
});

router.post('/auth/ses', (req, res, next) => {
  logger.debug('/auth/ses:', req.body);
  if(!req.body || !req.body['email'] || !req.body['password']) {
    res.status(StatusCodes.UNAUTHORIZED).send({err: "Invalid email or password!"});
    return;
  }
  let email = req.body['email'];
  let password = req.body['password'];
  rs.find("email=$1", [email]).then((exusr) => {
    if(exusr.length > 0) {
      exusr = exusr[0];
      if(exusr.state != Entity.ACTIVE){
        res.status(StatusCodes.UNAUTHORIZED).send({err: "User is not active!"});
        return;
      }
      // console.log(`exuser: ${JSON.stringify(exusr)}`);
      crypto.pbkdf2(password, exusr.salt, 310000, 32, 'sha256', (err, derivedKey) => {
        if (err || !crypto.timingSafeEqual(exusr.password, derivedKey)) {
          res.status(StatusCodes.UNAUTHORIZED).send({err: "Invalid email or password!"});
          return;
        }
        const token = IdGen.jwt({email: email});
        /* req.session.token = token;
        logger.debug('create /auth/ses:', req.session);
        req.session.save((err) => {
          if(err) res.sendStatus(StatusCodes.BAD_GATEWAY)
          else res.status(StatusCodes.OK).send({token: token});
        }); */
        res.status(StatusCodes.OK).send({token: token});
      });
    }else{
      res.status(StatusCodes.UNAUTHORIZED).send({err: "Invalid email or password!"});
    } 
  }).catch((err) => {
    logger.error(err);
    res.status(StatusCodes.UNAUTHORIZED).send({err: "Invalid email or password!"});
  });
});

//jwt refresh
router.put('/auth/ses', (req, res, next) => {
  
});

router.delete('/auth/ses', (req, res, next) => {
  logger.debug('delete /auth/ses:', req.session);
  req.session.destroy((err) => {
    if (err) { return next(err); }
    res.status(202).send();
  });
  /* if(!req.session.token) next()
  else{
    delete req.session.token;
    req.session.regenerate((err) => {
      if (err) { return next(err); }
      res.status(202).send();
    });
  } */
});

//us eto protect all apis 
const authorize = (req, res, next) => {
  logger.debug('authorize');
  let authh = req.headers.authorization;
  let frag;
  if(!authh || (frag = authh.split(' ')).length != 2 || !(/^Bearer$/i.test(frag[0]))){
    res.sendStatus(StatusCodes.UNAUTHORIZED);
    return;
  }
  const token = frag[1];
  logger.debug('tkn', token);
  IdGen.jwt_averify(token, (err, data) => {
    if(err){
      if(err.name == 'TokenExpiredError')
        res.status(StatusCodes.UNAUTHORIZED).send({err: 'Session has expired!'});
      else res.sendStatus(StatusCodes.UNAUTHORIZED);
      return;
    }
    rs.find("email=$1", [data['email']]).then((exusr) => {
      if(exusr.length > 0 && exusr[0].state == Entity.ACTIVE) {
        exusr = exusr[0];
        next();
      }else
        res.sendStatus(StatusCodes.UNAUTHORIZED);
    }).catch(err => {
      logger.error(err);
      res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
}


//OAuth 2.0, 
const server = oauth2orize.createServer();

server.serializeClient((client, done) => {
  return done(null, client.id);
});

server.deserializeClient((id, done) => {
  db.clients.findById(id, (error, client) => {
    if (error) return done(error);
    return done(null, client);
  });
});

server.grant(oauth2orize.grant.code((client, redirectURI, user, ares, done) => {
  var code = utils.uid(16);

  var ac = new AuthorizationCode(code, client.id, redirectURI, user.id, ares.scope);
  ac.save((err) => {
    if (err) { return done(err); }
    return done(null, code);
  });
}));

server.exchange(oauth2orize.exchange.code((client, code, redirectURI, done) => {
  AuthorizationCode.findOne(code, (err, code) => {
    if (err) { return done(err); }
    if (client.id !== code.clientId) { return done(null, false); }
    if (redirectURI !== code.redirectUri) { return done(null, false); }

    var token = utils.uid(256);
    var at = new AccessToken(token, code.userId, code.clientId, code.scope);
    at.save((err) => {
      if (err) { return done(err); }
      return done(null, token);
    });
  });
}));

router.get('/oauth/authorize',
  login.ensureLoggedIn(),
  server.authorize((clientID, redirectURI, done) => {
    Clients.findOne(clientID, (err, client) => {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.redirectUri != redirectURI) { return done(null, false); }
      return done(null, client, client.redirectURI);
    });
  }),
  (req, res) => {
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
   (req, res) => {
     res.json(req.user);
   });

 

module.exports = {
  authRouter: router,
  authorize
};