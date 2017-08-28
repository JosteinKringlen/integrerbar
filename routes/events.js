const express = require('express');
const mysql = require('mysql');
const router = express.Router();

//TODO: Switch these two before pushing to master/prod
//const connect = require('../connections');
const connect = require('../localConnections');

// As with any middleware it is quintessential to call next()
// if the user is authenticated
let isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
};

router.get('/', function(req, res, next) {

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password,
        dateStrings: 'date'
    });

    //Find all events order by date
    con.query('SELECT id, CONCAT(date," ", name) AS event FROM integrerbar2.skift ORDER BY date',function(err,rows){
        if(err) throw err;

        res.render('events', {
            title: 'events',
            listOfEvents: rows,
            user: req.user
        });
    });
    //Close communication with database
    con.end(function(err) {});

});

module.exports = router;