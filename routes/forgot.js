const express = require('express');
const router = express.Router();
const LocalStrategy   = require('passport-local').Strategy;
const User = require('../models/user');
const bCrypt = require('bcrypt');


router.get('/', function (req, res, next) {
    res.render('forgot', {title: 'Forgot', user: req.user});
});



module.exports = router;