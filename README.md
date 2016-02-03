REST-bac
=========
[![NPM Version][npm-image]][npm-url] [![Travis Build][travis-image]][travis-url]


> A REST based access control list middleware for [Express](http://expressjs.com/) applications.

This middleware allows to protect each method (GET,POST...) of any Express path (all the Express-style paths) with a set of custom roles specified in a configuration JSON.

## Install

In your project root type
`npm install rest-bac --save`

## Usage
To use the middleware you need an express application and a rest-bac configuration JSON. The express application should already provide a middleware or some other logic that set the ***req.user.roles*** property with an array of roles (string).

**NB:** the module protect exclusively the paths specified in the REST-BAC configuration JSON. If a business logic route path doesn't have a catching rest-bac path rule you have an Unhautorized 401 response.  

### JSON Configuration
The following configuration allow a "user" role to do GET requests to /book and all the paths under /book/* that don't match the path /book/admin/*. An "admin" role can do POST and GET requests to /book and all its descendant paths /book/*

```json
{
  "/book(/*)?": {
    "get": ["user", "admin"],
    "post": ["admin"]
  },

  "/book/admin/*": {
    "action": "deny",
    "get": ["user"]
  },

  "/author(/*)?": {
      "get": ["user","admin"]
  }
}
```

### Initialization

To initialize the rest role based access control simply use

```javascript
var restbac = require('rest-bac');

// some code to initialize the express app and the rest-bac configurations

// app is the expressjs application
// rbac-config is the JSON (parsed) object for the configuration
// prefix-path is an optional string to be prefixed to all the paths specified in the rbac-config
restbac(app, rbac-config, prefix-path)

```

## Full Example
This is a full example to better understand how to use the middleware.

### Server Application Code
This code can be found at /test/server.js. You can run and test it directly with `node test/server.js`.
```javascript
"use strict";

var express = require('express');
var restbac = require('rest-bac');

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
```

### Some requests
Valid request for a user role
```
GET /api/v1/book/123 HTTP/1.1
Host: 127.0.0.1:3000
Authorization: user


HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 3

123
```

Invalid role cause a 401 with a json error message
```
GET /api/v1/book/123 HTTP/1.1
Host: 127.0.0.1:3000
Authorization: invalid


HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
Content-Length: 63

{"message":"Unhautorized: Invalid role or path not configured"}
```

The user cannot request a path under /api/v1/book/admin/*
```
GET /api/v1/book/admin/some HTTP/1.1
Host: 127.0.0.1:3000
Authorization: user

HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
Content-Length: 63

{"message":"Unhautorized: Invalid role or path not configured"}
```
```
GET /api/v1/book/admin/some HTTP/1.1
Host: 127.0.0.1:3000
Authorization: admin


HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 10

admin path
```

[npm-image]: https://img.shields.io/npm/v/rest-bac.svg
[npm-url]: https://www.npmjs.com/package/rest-bac
[travis-image]: https://img.shields.io/travis/h4t0n/rest-bac.svg
[travis-url]: https://travis-ci.org/h4t0n/rest-bac
