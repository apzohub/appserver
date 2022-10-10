const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const { graphqlHTTP } = require('express-graphql');


const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

//Security
app.use(helmet());
app.disable('x-powered-by');

// Error handlers
app.use((req, res, next) => {
    res.status(404).send({err:"Not Found!"});
});
  
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({err:'Opps something went wrong!'});
});

var sess = {
  secret: 'ap whildcat',
  name: 'sessionId',
  cookie: {}
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1);
  sess.cookie.secure = true; 
  sess.httpOnly = true;
}

app.use(session(sess))

const asyncFn = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
};

/* app.get('/user', asyncFn(async (req, res, next) => {
  const user = await getUserById(req.params.id)
  res.send(user)
})); */


/* app.use('/gql', graphqlHTTP({
    schema: MyGraphQLSchema,
    graphiql: true,
  }),
); */


