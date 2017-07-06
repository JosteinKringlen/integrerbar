const express = require('express');
const router = express.Router();

let isAuthenticated = function (req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
};

/* GET home page. */
router.get('/', isAuthenticated ,function(req, res, next) {
    res.render('profile', { title: 'Profile', user:req.user });
});

router.get('/changePassword', isAuthenticated, function (req, res) {
    res.render('changePassword', {user: req.user});
});

module.exports = router;