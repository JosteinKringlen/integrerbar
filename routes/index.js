const express = require('express');
const passport = require('passport');
const router = express.Router();

module.exports = function (passport) {
    router.get('/', function(req, res) {
        res.render('index', { title: 'Integrerbar', user : req.user});
    });

    //router.get('/register', function(req, res) {
     //   res.render('register', { title: 'Register', user:req.user, message:req.flash('message')});
    //});

    //router.get('/login', function(req, res) {
     //   res.render('login', { title: 'Login', user : req.user });
    //});

    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    ////////////////
    //router.post('/login', passport.authenticate('local'), function(req, res) {
      //  res.redirect('/');
   // });

    /* Handle Login POST */
    router.post('/login', passport.authenticate('login', {
        successRedirect: '/',
        failureRedirect: '/',
        failureFlash : true
    }));

    /* Handle Registration POST */
    router.post('/signup', passport.authenticate('signup', {
        successRedirect: '/',
        failureRedirect: '/register',
        failureFlash : true
    }));


    const db = require('mongoskin').db("mongodb://localhost/integrerbar", { w: 0});
    db.bind('calendar');

    router.get('/init', function(req, res){
        db.calendar.insert({
            text:"My test event A",
            start_date: new Date(2013,8,1),
            end_date:   new Date(2013,8,5)
        });
        db.calendar.insert({
            text:"One more test event",
            start_date: new Date(2013,8,3),
            end_date:   new Date(2013,8,8),
            color: "#DD8616"
        });

        /*... skipping similar code for other test events...*/

        res.send("Test events were added to the database")
    });

    router.get('/data', function(req, res){
        db.calendar.find().toArray(function(err, data){
            //set id property for all records
            for (let i = 0; i < data.length; i++)
                data[i].id = data[i]._id;

            //output response
            res.send(data);
        });
    });

    router.post('/data', function(req, res){
        let data = req.body;

        //get operation type
        let mode = data["!nativeeditor_status"];
        //get id of record
        let sid = data.id;
        let tid = sid;

        //remove properties which we do not want to save in DB
        delete data.id;
        delete data.gr_id;
        delete data["!nativeeditor_status"];


        //output confirmation response
        function update_response(err, result){
            if (err)
                mode = "error";
            else if (mode == "inserted")
                tid = data._id;

            res.setHeader("Content-Type","text/xml");
            res.send("<data><action type='"+mode+"' sid='"+sid+"' tid='"+tid+"'/></data>");
        }

        //run db operation
        if (mode == "updated")
            db.calendar.updateById( sid, data, update_response);
        else if (mode == "inserted")
            db.calendar.insert(data, update_response);
        else if (mode == "deleted")
            db.calendar.removeById( sid, update_response);
        else
            res.send("Not supported operation");
    });

    return router;
};