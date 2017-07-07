module.exports = {
    'mongoUrl': process.env.MONGODB_URI,
    'sqlUrl': {
        host: process.env.SQL_HOST,
        user: process.env.SQL_USER,
        password: process.env.SQL_PW
    },
    'gmailLogin': {
        user: process.env.GMAIL_USER ,
        password: process.env.GMAIL_PW
    }
};