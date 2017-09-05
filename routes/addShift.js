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

let isInfoPassed = function (req, res, next) {
    if(req.body.eventNumber != null)
        return next();

    res.redirect('/')
};

router.post('/', isAuthenticated, findResponsible, findEveryone, findShift, renderPage);

router.get('/', isAuthenticated, isInfoPassed, function (req, res) {
    renderPage(req,res)
})

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
        dateStrings: 'date',
        connectTimeout: 60000

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
        dateStrings: 'date',
        connectTimeout: 60000

    });

    con.query('SELECT id, navn FROM integrerbar2.intern WHERE aktiv = 1 ORDER BY navn',function(err,rows) {
        if (err) throw err;
        req.everyone = rows;
        con.end(function(err) {});
        return next();
    });
}

/**
 * Find a list of all interns working in a specific event
 *
 * @param req
 * @param res
 * @param next
 */
function findShift(req, res, next) {

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password,
        dateStrings: 'date',
        connectTimeout: 60000

    });

    let passedVariable = req.query.valid;

    let choseEvent = (req.body.choseEvent);


    let id;

    if (passedVariable == null) {
        id = choseEvent;
        req.selectedEvent = choseEvent;
        console.log(id + "  1  " + choseEvent)
    }else {
        id = passedVariable;
        req.selectedEvent = passedVariable;
        console.log(id + "  2  " + passedVariable)
    }

    //TODO: Make the where statement editable
    con.query("select navn, start_time, end_time from integrerbar2.skift INNER JOIN integrerbar2.vakter ON integrerbar2.skift.id=integrerbar2.vakter.skift_id INNER JOIN integrerbar2.intern ON integrerbar2.intern.id=integrerbar2.vakter.intern_id where integrerbar2.skift.id = ? ORDER BY start_time",[id],function(err,rows) {
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
        selectedEvent: req.selectedEvent,
        user: req.user
    });
    //res.render('addShift', { title: 'addShift' ,user: req.user});
}

router.post('/insert',function(req, res){

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password,
        dateStrings: 'date'

    });

    let name = (req.body.name);
    let start = (req.body.start_time);
    let end = (req.body.end_time);
    let event = (req.body.event);
    let shiftType = (req.body.shiftType);
    let eventNumber = (req.body.eventNumber);


    let opening = false;
    let responsible = false;

    if(shiftType === "Opening")
        opening = true;
    else if(shiftType === "Responsible")
        responsible = true;

    console.log(opening + " " + responsible);

    //TODO: Remove shift_id constant
    if(typeof name === "string") {
        con.query("INSERT INTO integrerbar2.vakter (skift_id, intern_id, start_time, end_time,emergency) VALUES (?, ?, ? ,?,false);", [eventNumber, name, start, end], function (err, result) {
            if (err) throw err;
        });

    }else {
        for (let i = 0; i < name.length; i++) {
            con.query("INSERT INTO integrerbar2.vakter (skift_id, intern_id, start_time, end_time,emergency) VALUES (?, ?, ? ,?,false);", [eventNumber, name[i], start[i], end[i]], function (err, result) {
                if (err) throw err;
            });
        }
    }


    con.query("update integrerbar2.skift set opening = ?, responsible = ? where id = ?",[opening,responsible,event], function (err, result) {
        if (err) throw err;
    });
    let string = encodeURIComponent(eventNumber);
    res.redirect(307,'/addShift/?valid=' + string);
    con.end(function(err) {});

});

module.exports = router;