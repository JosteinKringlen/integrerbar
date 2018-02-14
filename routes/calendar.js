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

    con.query('select id, navn from integrerbar2.intern', function(err, rows) {
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

    con.query('select vakter.skift_id, date, weekday(date) as day,comments, name,tableIntern.navn, vakter.start_time ,vakter.end_time, vakter.type \n' +
        'from integrerbar2.vakter \n' +
        'inner join integrerbar2.skift on integrerbar2.vakter.skift_id=skift.id \n' +
        'inner join integrerbar2.intern as tableIntern on integrerbar2.vakter.intern_id=tableIntern.id where date >= CURDATE()' +
        'order by skift.date, vakter.start_time, case when type = "Åpning" then 1 when type = "Vakt" then 2 when type = "Ekstravakt" then 3 when type = "Ansvarsvakt" then 4 end', function(err, rows) {
        if(err) throw err;

        rows = convertDate(rows);

        res.render('calendar_v2', {
            title: 'Calendar',
            listOfShifts: rows,
            listOfNames: req.names,
            user: req.user
        });

        con.end(function(err) {});

    });

});

router.post('/shiftByName',function (req,res) {

    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password,
        dateStrings: 'date'
    });

    con.query('select date, weekday(date) as day, type, start_time, end_time, name from integrerbar2.vakter as vakter\n' +
        'inner join integrerbar2.skift as skift on vakter.skift_id = skift.id\n' +
        'where intern_id = ? and date >= CURDATE() order by date', req.body.findName,function (err, rows) {

        if(err) throw err;

        rows = convertDate(rows);
        console.log(rows);

        res.render('calendar_single', {
            title: 'Calendar',
            listOfShifts: rows,
            user: req.user
        });

    });

    con.end(function(err) {});

});

/**
 *
 * Convert date and weekday(date) as day into a better looking date formatting.
 *
 * @param rows
 * @returns {*}
 */
function convertDate(rows){

    let months = ["Januar","Februar","Mars","April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember"];
    let days = ["Man", "Tirs", "Ons", "Tors", "Fre", "Lør", "Søn"];

    for(let i=0; i<rows.length;i++){

        let day = days[rows[i].day];

        let date = rows[i].date.split("-");
        let month = parseInt(date[1],10);

        month = months[month-1];

        rows[i].date = day + " " + date[2] + ". " + month;

    }

    return rows;

}

module.exports = router;