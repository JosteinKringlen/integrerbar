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

router.get('/', isAuthenticated, function(req, res, next) {
    res.render('addShift', { title: 'addShift' ,user: req.user});
});

router.post('/insert',function(req, res){

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password,
        dateStrings: 'date'

    });

    let name = (req.body.navn);
    let start = (req.body.start_time);
    let end = (req.body.end_time);
    let event = (req.body.event);
    let opening = (req.body.opening);
    let responsible = (req.body.responsible);

    console.log(event);

    if(typeof name === "string") {
        con.query("INSERT INTO integrerbar2.vakter (skift_id, intern_id, start_time, end_time,emergency) VALUES (?, ?, ? ,?,false);", [event, name, start, end], function (err, result) {
            if (err) throw err;
        });

    }else {
        for (let i = 0; i < name.length; i++) {
            con.query("INSERT INTO integrerbar2.vakter (skift_id, intern_id, start_time, end_time,emergency) VALUES (?, ?, ? ,?,false);", [event, name[i], start[i], end[i]], function (err, result) {
                if (err) throw err;
            });
        }
    }

    con.query("update integrerbar2.skift set opening = ?, responsible = ? where id = ?",[opening,responsible,event], function (err, result) {
        if (err) throw err;
    });

    res.redirect('/index');
    con.end(function(err) {});

});

module.exports = router;