const router = require('express').Router();
const asyncFn = require('./com');

/* router.get('/user', asyncFn(async (req, res, next) => {
  const user = await getUserById(req.params.id)
  res.send(user)
})); */


/* router.use('/gql', graphqlHTTP({
    schema: MyGraphQLSchema,
    graphiql: true,
  }),
); */


// GET method route
router.get('/', (req, res) => {
    res.send('GET request to the homepage')
});
  
  // POST method route
router.post('/', (req, res) => {
    res.send('POST request to the homepage')
})
  
router.route('/book')
    .get((req, res) => {
      res.send('Get a random book')
    })
    .post((req, res) => {
      res.send('Add a book')
    })
    .put((req, res) => {
      res.send('Update the book')
    })
  

module.exports = router;