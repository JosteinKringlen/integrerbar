const express = require('express');
const mysql = require("mysql");
const router = express.Router();
const bodyParser = require('body-parser');

//TODO: Switch these two before pushing to master/prod
//const connect = require('../connections');
const connect = require('../localConnections');


let isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated() && req.user.admin === 'true')
        return next();
    // if the user is not authenticated then redirect him to the login page
    res.redirect('/');
};

router.get('/', isAuthenticated,function(req, res){

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password,
        dateStrings: 'date'

    });

    con.query("select id, date ,name FROM integrerbar2.skift ORDER BY date",function(err,rows) {
        if (err) throw err;

        res.render('findShift', {
            title: 'findShift',
            listOfShift: rows,
            user: req.user
        });
    });
    con.end(function(err) {});

});
module.exports = router;