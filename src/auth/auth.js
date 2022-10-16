const router = require('express').Router();
// const joi = require('joi');
const passport = require('passport');
const MagicLinkStrategy = require('passport-magic-link').Strategy;

const asyncFn = require('../com');


passport.use(new MagicLinkStrategy({
  secret: 'ap whildcat',
  userFields: [ 'email' ],
  tokenField: 'token',
  verifyUserAfterToken: true
}, function send(user, token) {
  var link = 'https://localhost:8443/auth/reg/verify?token=' + token;
  var msg = {
    to: user.email,
    from: process.env['EMAIL'],
    subject: 'Sign in to Todos',
    text: 'Hello! Click the link below to finish signing in to Todos.\r\n\r\n' + link,
    html: '<h3>Hello!</h3><p>Click the link below to finish signing in to Todos.</p><p><a href="' + link + '">Sign in</a></p>',
  };
  console.log(msg);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve("foo");
    }, 300);
  });
}, function verify(user) {
  return new Promise(function(resolve, reject) {
    db.get('SELECT * FROM users WHERE email = ?', [
      user.email
    ], function(err, row) {
      if (err) { return reject(err); }
      if (!row) {
        db.run('INSERT INTO users (email, email_verified) VALUES (?, ?)', [
          user.email,
          1
        ], function(err) {
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

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, email: user.email });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

router.post('/auth', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/err'
}));

router.post('/auth/reg', passport.authenticate('magiclink', {
  action: 'requestToken',
  failureRedirect: '/err',
  failureMessage: true
}), function(req, res, next) {
  res.redirect(process.env.WEBAPP_URL+'/echeck');
});

router.get('/auth/reg/verify', passport.authenticate('magiclink', {
  successReturnToOrRedirect: '/',
  failureRedirect: '/err',
  failureMessage: true
}));

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});


module.exports = router;