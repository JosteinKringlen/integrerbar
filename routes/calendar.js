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



function findName(req,res,next) {

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password,
        dateStrings: 'date'
    });

    con.query('select  name, date, comments, opening, responsible from ((integrerbar2.vakter inner join  integrerbar2.intern ON integrerbar2.vakter.intern_id = integrerbar2.intern.id) inner join integrerbar2.skift ON integrerbar2.vakter.skift_id = integrerbar2.skift.id)  ORDER BY date', function(err, rows) {
        if(err) throw err;
        req.names = rows;
        return next();

    });

}

/* GET home page. */
router.get('/'/*,isAuthenticated*/,findName,function(req, res, next) {


    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password,
        dateStrings: 'date'
    });

    con.query('select vakter.skift_id as id, date,comments, name,tableIntern.navn, vakter.start_time ,vakter.end_time, tableOpening.navn as opening, tableResponsible.navn as responsible from integrerbar2.vakter inner join integrerbar2.skift on integrerbar2.vakter.skift_id=skift.id inner join integrerbar2.intern as tableIntern on integrerbar2.vakter.intern_id=tableIntern.id inner join integrerbar2.intern as tableOpening on integrerbar2.skift.opening=tableOpening.id inner join integrerbar2.intern as tableResponsible on integrerbar2.skift.responsible=tableResponsible.id', function(err, rows) {
        if(err) throw err;

        res.render('calendar_v2', {
            title: 'Calendar',
            listOfShifts: rows,
            listOfNames: req.names,
            user: req.user
        });

        con.end(function(err) {});

    });

});


module.exports = router;