const express = require('express');
const mysql = require("mysql");
const router = express.Router();
const connect = require('../connections');

router.get('/', function(req, res, next) {

    //Connecting to databace
    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user: connect.sqlUrl.user,
        password: connect.sqlUrl.password
    });

    con.connect(function(err){
        if(err){
            console.log('Error connecting to Db');
            return;
        }
        console.log('Connection established');
    });

    //Find all the active interns sorted by name
    con.query('SELECT navn,epost,telefonnummer FROM integrerbar2.intern WHERE aktiv = 1 ORDER BY navn',function(err,rows){
        if(err) throw err;

        res.render('internList', {
            title: 'internList',
            listOfInterns: rows,
            user: req.user
        });
    });
    //Close communication with database
    con.end(function(err) {});

});

module.exports = router;