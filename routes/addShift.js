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

router.get('/', isAuthenticated, findResponsible, findEveryone, findShift, renderPage);

/**
 * Connects to database, find all interns that can work a responsible shift and moves on to the next quarry.
 *
 * @param req
 * @param res
 * @param next
 */
function findResponsible(req, res, next) {

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password,
        dateStrings: 'date'

    });

    con.query('SELECT id, navn FROM integrerbar2.intern WHERE aktiv = 1 and skiftansvarlig = 1 ORDER BY navn', function (err, rows) {
        if (err) throw err;
        req.responsible = rows;
        con.end(function(err) {});
        return next();

    });
}

/**
 * Connects to database, find all interns and moves on to the rendering,
 *
 * @param req
 * @param res
 * @param next
 */
function findEveryone(req, res, next) {

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password,
        dateStrings: 'date'

    });

    con.query('SELECT id, navn FROM integrerbar2.intern WHERE aktiv = 1 ORDER BY navn',function(err,rows) {
        if (err) throw err;
        req.everyone = rows;
        con.end(function(err) {});
        return next();
    });
}

function findShift(req, res, next) {

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password,
        dateStrings: 'date'

    });

    con.query("select id, date ,name FROM integrerbar2.skift ORDER BY date",function(err,rows) {
        if (err) throw err;
        req.shift = rows;
        con.end(function(err) {});
        return next();
    });

}

/**
 * Renders the page and sends quarry results
 *
 * @param req
 * @param res
 */
function renderPage(req, res) {
    res.render('addShift', {
        title: 'Add shift',
        everyone: req.everyone,
        responsible: req.responsible,
        shift: req.shift,
        user: req.user
    });
}

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