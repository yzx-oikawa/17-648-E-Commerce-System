var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'ecsystem.c9uizvfhetbv.us-east-1.rds.amazonaws.com',
    port     : '3306',
    user     : 'zixinye',
    password : 'yezixin0612',
    database : 'ecsystem'

    // host     : 'localhost',
    // port     : '3306',
    // user     : 'root',
    // password : 'password',
    // database : 'esystem'
});


module.exports.connection = connection;