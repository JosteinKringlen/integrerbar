const express = require('express');
const mysql = require("mysql");
const router = express.Router();

//TODO: Switch these two before pushing to master/prod
//const connect = require('../connections');
const connect = require('../localConnections');

let isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated() && req.user.admin === 'true')
        return next();
    // if the user is not authenticated then redirect him to the login page
    res.redirect('/');
};


/* GET home page. */
router.get('/', isAuthenticated, function(req, res, next) {
    res.render('registerUser', { title: 'Register user', user: req.user });
});

router.post('/insert',function(req, res){

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password
    });

    con.query('INSERT INTO integrerbar2.intern SET ?', req.body, function(err, result) {});

    res.redirect('/registerUser');

});

module.exports = router;