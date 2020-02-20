var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'ecsystem.c9uizvfhetbv.us-east-1.rds.amazonaws.com',
    port     : '3306',
    user     : 'zixinye',
    password : 'yezixin0612',
    database : 'ecsystem'
});

module.exports.connection = connection;