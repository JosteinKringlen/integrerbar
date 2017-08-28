const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const async = require('async');
const crypto = require('crypto');
const User = require('./models/user');
const nodemailer = require('nodemailer');
const bCrypt = require('bcrypt');


/////////////////////////////////////////////////

//TODO: Switch these two before pushing to master/prod
//const connect = require('./connections');
const connect = require('./localConnections');


const mongoose = require('mongoose');
const passport = require('passport');
mongoose.Promise = global.Promise;
mongoose.connect(connect.mongoUrl, {useMongoClient: true});
const expressSession = require('express-session');

/////////////////////////////////////////////////

const index = require('./routes/index')(passport);
const users = require('./routes/users');
const passportRoute = require('./routes/passport')(passport);
const calendar = require('./routes/calendar');
//const profile = require('./routes/profile');
const addShift = require('./routes/addShift');
const internList = require('./routes/internList');
const registerUser = require('./routes/registerUser');
const addEvent = require('./routes/addEvent');
const forgot = require('./routes/forgot');
const help = require('./routes/help');
const events = require('./routes/events');
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('node-sass-middleware')({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public'),
    indentedSyntax: true,
    sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/scripts', express.static(__dirname + '/node_modules/dhtmlx-scheduler/codebase/'));


app.use(expressSession({
    secret: 'mySecretKey',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// Using the flash middleware provided by connect-flash to store messages in session
// and displaying in templates
const flash = require('connect-flash');
app.use(flash());

const exflash = require('express-flash');
app.use(exflash());

// Initialize Passport
const initPassport = require('./passport/init');
initPassport(passport);


app.use('/', index);
app.use('/users', users);
app.use('/passport', passportRoute);
app.use('/calendar', calendar);
//app.use('/profile', profile);
app.use('/addShift', addShift);
app.use('/internList', internList);
app.use('/registerUser', registerUser);
app.use('/addEvent', addEvent);
app.use('/forgot', forgot);
app.use('/help', help);
app.use('/events', events);

app.post('/forgot', function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                let token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    req.flash('error', 'Det finnes ingen bruker med den epostadressen.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            let smtpTransport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: connect.gmailLogin.user,
                    pass: connect.gmailLogin.pass
                }
            });
            const mailOptions = {
                from: '"Noreply Integrerbar" <resetpassword@integrerbar.no>',
                to: user.email,
                subject: 'Nullstill Passord',
                text: 'Du mottar denne eposten fordi du (eller noen andre) har bedt om å nullstille passordet til din bruker.\n\n' +
                    'Vennligst klikk på følgende link, eller kopier denne inn i din nettleser for å fullføre nullstillingen: \n\n' +
                    'http://' + req.headers.host + '/reset' + '/'+token + '\n\n'+
                    'Hvis du ikke har bedt om å nullstille passordet så kan du se bort ifra denne eposten.'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('info', 'En epost har blitt sendt til ' + user.email + ' med instrukser.');
                done(err, 'done');
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

app.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            req.flash('error', 'Nullstillingskoden er ugyldig, eller har utløpt..');
            return res.redirect('/forgot');
        }
        res.render('reset', {
            user: req.user
        });
    });
});

app.post('/reset/:token', function(req, res) {
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                    req.flash('error', 'Nullstillingskoden er ugyldig, eller har utløpt.');
                    return res.redirect('back');
                }

                user.password = createHash(req.body.password);
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function(err) {
                    done(err, user);
                    res.redirect('/');
                });
            });
        },
        function(user, done) {
            const smtpTransport = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: connect.gmailLogin.user,
                    pass: connect.gmailLogin.pass
                }
            });
            const mailOptions = {
                from: '"Noreply Integrerbar" <resetpassword@integrerbar.no>',
                to: user.email,
                subject: 'Ditt passord har blitt endret',
                text: 'Hei,\n\n' +
                'Dette er en bekreftelse på at passordet til din epost: ' + user.email + ' nettopp har blitt endret.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('success', 'Success! Ditt passord er nå endret.');
                done(err);
            });
        }
    ], function(err) {
        res.redirect('/');
    });
});
let createHash = function(password){
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});




module.exports = app;
