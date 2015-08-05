/* jshint mocha : true */
/* jshint -W030 */
"use strict";


var express = require('express');

var request = require('supertest');
var chai = require('chai');
var expect = chai.expect;
chai.should();


var rest_bac = require('../src');

var app = express();


var config = {

    "/ua*": {
        get: ['user', 'admin', 'superadmin'],
        post: ['admin']
    },

    "/ua/a": {
        action: 'deny',
        get: ['user']
    },


    "/ua/a/u": {
        get: ['user']
    },

    "/ua/a/s": {
        action: 'deny',
        get: ['user', 'admin']
    }

};

app.use(function (req, res, next) {

    req.user = {};
    var auth = req.get('Authorization');
    if (typeof auth != "undefined")
        req.user.roles = auth.split(" ");
    else
        req.user.roles = [];
    next();
});

rest_bac(app, config);


app.get('/ua', function (req, res) {
    res.send("ua");
});

app.get('/ua/ua', function (req, res) {
    res.send("ua/ua");
});

app.get('/ua/a', function (req, res) {
    res.send("ua/a");
});

app.get('/ua/a/u', function (req, res) {
    res.send("ua/a/u");
});

app.post('/ua/a/u', function (req, res) {
    res.sendStatus(201);
});

app.get('/ua/a/s', function (req, res) {
    res.send("ua/a/s");
});

// error handler
app.use(function (err, req, res, next) {

    res.status(err.status || 500);
    res.json({
        message: err.message
    });

});


describe('REST-bac simple tests', function () {

    it('Should return a 401 unhautorized when no authentication is provided', function (done) {

        request(app)
            .get('/ua')
            .expect(401, done);

    });

    it('Should authorize the "user" role and return 200', function (done) {

        request(app)
            .get('/ua/ua')
            .set('Authorization', 'user')
            .expect(200)
            .expect("ua/ua", done);

    });

    it('Should authorize the "admin" role and return 200', function (done) {

        request(app)
            .get('/ua/a')
            .set('Authorization', 'admin')
            .expect(200)
            .expect("ua/a", done);

    });

    it('Should authorize an array of roles containing at least a valid one and return 200', function (done) {

        request(app)
            .get('/ua/ua')
            .set('Authorization', 'admin notinrole')
            .expect(200)
            .expect("ua/ua", done);

    });

    it('Should deny the "user" role and return 401', function (done) {

        request(app)
            .get('/ua/a')
            .set('Authorization', 'user')
            .expect(401, done);

    });

    it('Should authorize the "user" role and return 200', function (done) {

        request(app)
            .get('/ua/a/u')
            .set('Authorization', 'user')
            .expect(200)
            .expect("ua/a/u", done);

    });


    it('Should deny an array of invalid roles and return 401', function (done) {

        request(app)
            .get('/ua/a')
            .set('Authorization', 'user anotherinvalidrole')
            .expect(401, done);

    });


    it('Should authorize the "admin" role even if the req roles contains others invalid roles', function (done) {

        request(app)
            .get('/ua/a')
            .set('Authorization', 'admin user')
            .expect(200)
            .expect("ua/a", done);

    });

    it('Should authorize the "superadmin" role and return 200', function (done) {

        request(app)
            .get('/ua/a/s')
            .set('Authorization', 'superadmin')
            .expect(200)
            .expect("ua/a/s", done);

    });

    it('Should deny an array of not "superadmin" roles and return 401', function (done) {

        request(app)
            .get('/ua/a/s')
            .set('Authorization', 'admin user')
            .expect(401, done);

    });

    it('Should authorize the "admin" role and return 201', function (done) {

        request(app)
            .post('/ua/a/u')
            .set('Authorization', 'admin')
            .expect(201, done);

    });

    it('Should deny the "user" role and return 401', function (done) {

        request(app)
            .post('/ua/a/u')
            .set('Authorization', 'user')
            .expect(401, done);

    });



});