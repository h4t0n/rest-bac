"use strict";
/*jshint -W083 */

//-------------------------------------
// MODULE DEPENDENCIES
//-------------------------------------
var _ = require("underscore");

//-------------------------------------
// DEBUGGIN DEPENDENCIES
//-------------------------------------

// init debug (when the app is initialized with the protecting roles)
var init_debug = require('debug')('REST-bac:initialization');
// running debug (when the express app is running)
var running_debug = require('debug')('REST-bac:running');

//--------------------------------------



/**
 * Install protecting routes into the app express application. Roles are defined in the config
 * @param   {Object} app    The expressjs application to protect with
 * @param   {Object} config Define the path/method/roles configuration
 * @param {String} The prefix string of each path to protect
 */
function protect_roles(app, config, prefix) {

    for (var path in config) {

        init_debug("Protecting path: " + prefix + path);

        var allow = true;
        if (config[path].action === "deny")
            allow = false;

        init_debug("Allow: " + allow);

        for (var method in config[path]) {

            init_debug("Protecting method: " + method);

            if (method != "action") {

                var config_array = config[path][method];

                app[method](prefix + path, (function (allow, conf) {

                    return function (req, resp, next) {

                        running_debug("config roles: " + conf);
                        running_debug("req roles: " + req.user.roles.toString());

                        var active_roles = _.intersection(conf, req.user.roles);

                        running_debug("active roles: " + active_roles);


                        if (active_roles.length > 0) {
                            running_debug("active roles > 0");
                            if (allow) {
                                running_debug("path allowed");

                                req.user.authorized_roles = _.union(req.user.authorized_roles, active_roles);

                            } else {
                                running_debug("path not allowed");
                                req.user.authorized_roles = _.difference(req.user.authorized_roles, active_roles);
                            }
                        }
                        next();
                    };

                })(allow, config_array));
            }
        }
    }

}

/**
 * The middleware to check if the request contains at least one roles enabled to
 * fullfill the requesting resource
 * @param   {Object}   req  the requsest object
 * @param   {Object} res  the response object
 * @param   {Function} next next middlware
 * @returns {Function} the next middleware or 401
 */
function check_role_authorization(req, res, next) {

    if (!req.hasOwnProperty("user") || !req.user.hasOwnProperty('authorized_roles') ||
        !(req.user.authorized_roles instanceof Array) || req.user.authorized_roles.length === 0){

        running_debug("Unhautorized: Invalid role or path not configured");
        var err = new Error("Unhautorized: Invalid role or path not configured");
        err.status = 401;
        return next(err);

    }

    running_debug("Authorized roles: " + req.user.authorized_roles);
    return next();


}





module.exports = function (app, config, prefix) {

    // to protect the app with the path/method/roles defined in config
    // we need to create apps middlwares/routes for each path/method
    // (done by protect_roles) and then to add a middlware to check
    // if at least one requesting role satisfies the path/method roles
    // done by (check_role_authorization)

    if (!prefix || typeof prefix != "string") prefix = "";

    protect_roles(app, config, prefix);
    app.use(prefix + "*", check_role_authorization);

};
