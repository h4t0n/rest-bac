"use strict";

var express = require('express');
var restbac = require('../src');

// some code to initialize the express app and the rest-bac configurations
var app = express();

// before use rest-bac the express app need to extract some roles from the request
// and put them in the req.user.roles array 
app.use(function (req, res, next) {
    req.user = {};
    var auth = req.get('Authorization');
    if (typeof auth != "undefined")
        req.user.roles = auth.split(" ");
    else
        req.user.roles = [];
    next();
});

var config = {
    "/book(/*)?": {
        get: ["user", "admin"],
        post: ["admin"]
    },
    "/book/admin/*": {
        action: "deny",
        get: ["user"]
    }
};

// setup the rest methods protection --> paths in config are prefixed with "/api/v1"
restbac(app, config, "/api/v1");

// now we can define some business logic API routes
app.get("/api/v1/book/:id", function (req, res, next) {
    // user and admin roles can reach this function
    res.send(req.params.id);
});
app.post("/api/v1/book", function (req, res, next) {
    // only the admin can reach this function
    res.send("POST OK");

});
app.get("/api/v1/book/admin/some", function (req, res, next) {
    // only the admin can reach this function
    res.send("admin path");
});


// a simple error handler to catch authorization error 
app.use(function (err, req, res, next) {

    // rest-bac authorization error propagate an Error object with a 401 status code

    res.status(err.status || 500);
    res.json({
        message: err.message
    });

});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});