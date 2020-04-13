var connection = require('./db').connection;
connection.connect();

var express = require("express");
var session = require("express-session");
var app = express();
app.use(express.json());

var profile = require('./routes/profile.js');
var product = require('./routes/product.js');
var purchase = require('./routes/purchase.js');

app.use('', profile);
app.use('', product);
app.use('', purchase);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

