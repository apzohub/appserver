if(process.env.OPEN_API === 'true'){

    const router = require('express').Router();
    const asyncFn = require('../com');

    const openApiView = require('swagger-ui-express');
    const openApiSpec = require('../../etc/openapi.json');
    //const openApiSpecAuto = require('swagger-autogen');
  
    //swagger
    // https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/configuration.md
    let options = {
        explorer: true,
        swaggerOptions: {
            url: "/api-docs/openapi.json",
        },
    }
    // app.use('/api-docs', openApiView.serve, openApiView.setup(openApiSpec, options));
    router.get("/api-docs/openapi.json", (req, res) => res.json(openApiSpec));
    router.use('/api-docs', openApiView.serveFiles(null, options), openApiView.setup(null, options));

    module.exports = router;
}