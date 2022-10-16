/**
 * Authentication & Authorization 
 * support 2FA (MFA), SSO.
 */

const router = require('express').Router();
const asyncFn = require('../com');
// const joi = require('joi');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const MagicLinkStrategy = require('passport-magic-link').Strategy;


passport.use(new LocalStrategy(function verify(username, password, cb) {
   console.log('local');
   db.get('SELECT * FROM users WHERE username = ?', [ username ], function(err, user) {
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

/* passport.use(new MagicLinkStrategy({
  secret: 'ap whildcat',
  userFields: [ 'email' ],
  tokenField: 'token',
  verifyUserAfterToken: true
}, function send(user, token) {
  var link = `${process.env.WEBAPP_URL}/reg/verify?token=${token}`;
  var msg = {
    to: user.email,
    from: process.env.EMAIL,
    subject: `Sign in to ${process.env.APP}`,
    text: `Hello! Click the link below to finish signing in to ${process.env.APP}.\r\n\r\n ${link}`,
    html: `<h3>Hello!</h3><p>Click the link below to finish signing in to Todos.</p><p><a href="${link}">Sign in</a></p>`,
  };
  console.log(msg);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("foo");
    }, 300);
  });
}, function verify(user) {
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
})); */

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
  // res.sendStatus(200);//(process.env.WEBAPP_URL+'/echeck');
});

router.get('/auth/reg/verify', passport.authenticate('magiclink', {
  failureMessage: true,
  successMessage: true
}), (req, res, next) => {
  console.log('/auth/reg/verify:', req.body);
  res.status(202);//.send({location:'/reg/echeck'});
  // res.sendStatus(200);//(process.env.WEBAPP_URL+'/echeck');
});

//(req, res, next) => {console.log('/auth/ses!!!', req.body); next();}

router.post('/auth/ses', passport.authenticate('local', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/auth',
  failureMessage: true
}), (req, res, next) => {
  // console.log('/auth/ses:', req.body);
  res.status(200).send({location:'/'});
  // res.sendStatus(200);//(process.env.WEBAPP_URL+'/echeck');
});

router.delete('/auth/ses', (req, res, next) => {
  // console.log('/auth/ses:', req.body);
  req.logout((err) => {
    if (err) { return next(err); }
    res.status(202);
  });
});


module.exports = router;