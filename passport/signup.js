const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bCrypt = require('bcrypt');
const mysql = require('mysql');
const connect = require('../connections');


module.exports = function (passport) {


    // Generates hash using bCrypt
    let createHash = function (password) {
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };
    const con = mysql.createConnection({
        host: connect.sqlUrl.host,
        user : connect.sqlUrl.user,
        password: connect.sqlUrl.password
    });

    passport.use('signup', new LocalStrategy({
            usernameField: 'email',
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, username, password, done) {
            findOrCreateUser = function () {
                con.query('select navn, epost from integrerbar2.intern where epost=' + con.escape(username), function (err, rows) {
                    if (err) throw err;
                    console.log("Connection to mysql successful");
                    console.log(rows);
                    if (rows.length === 0) {
                        console.log('Epost ikke registrert: ' + username);
                        return done(null, false, req.flash('message', 'Epost ikke registrert'));
                    }


                    // find a user in Mongo with provided username
                    User.findOne({'email': username}, function (err, user) {
                        // In case of any error, return using the done method
                        if (err) {
                            console.log('Error in SignUp: ' + err);
                            return done(err);
                        }
                        // already exists
                        if (user) {
                            console.log('User already exists with username: ' + username);
                            return done(null, false, req.flash('message', 'User Already Exists'));
                        } else {
                            // if there is no user with that email
                            // create the user
                            let newUser = new User();

                            // set the user's local credentials
                            //newUser.username = username;
                            newUser.password = createHash(password);
                            newUser.email = username;
                            newUser.name = rows[0].navn;

                            // save the user
                            newUser.save(function (err) {
                                if (err) {
                                    console.log('Error in Saving user: ' + err);
                                    throw err;
                                }
                                console.log('User Registration succesful');
                                return done(null, newUser);
                            });
                        }
                    });
                });
            };
            // Delay the execution of findOrCreateUser and execute the method
            // in the next tick of the event loop
            process.nextTick(findOrCreateUser);
        })
    );

    /* passport.use('signup', new LocalStrategy({
     username : String,
     password : String,
     passReqToCallback : true // allows us to pass back the entire request to the callback
     },
     function(req, username, password, done) {
     con.query("select * from integrerbar2.brukere where username = '"+username+"'",function(err,rows){
     console.log(rows);
     console.log("above row object");
     if (err)
     return done(err);
     if (rows.length) {
     return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
     } else {

     // if there is no user with that email
     // create the user
     var newUser = {};

     newUser.username    = username;
     newUser.password = createHash(password); // use the generateHash function in our user model

     var insertQuery = "INSERT INTO integrerbar2.brukere ( username, password ) values ('" + username +"','"+ newUser.password +"')";
     console.log(insertQuery);
     con.query(insertQuery,function(err,rows){
     newUser.id = rows.insertId;

     return done(null, newUser);
     });
     }
     });
     }));
     var createHash = function(password){
     return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
     }*/
};