const express = require('express');
const mysql = require("mysql");
const router = express.Router();
const connect = require('../connections');

let isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated() && req.user.admin === 'true')
        return next();
    // if the user is not authenticated then redirect him to the login page
    res.redirect('/');
};

/* GET home page. */
router.get('/', isAuthenticated,function(req, res, next) {
    res.render('addEvent', { title: 'addEvent' ,user: req.user});
});

router.post('/insert',function(req, res){

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user: connect.sqlUrl.user,
        password: connect.sqlUrl.password
    });

    con.query('INSERT INTO integrerbar2.skift SET ?', req.body, function(err, result) {});

    res.redirect('/addEvent');

});

module.exports = router;