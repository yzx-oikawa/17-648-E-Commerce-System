var connection = require('../db').connection;
var express = require('express');
var session = require("express-session");
var router = express.Router();

router.use(session({
    secret: 'test secret',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 60 * 1000 * 15 } //ms
}));

router.post('/registerUser', (req, res) => {
    if (req.body.fname === undefined || req.body.lname === undefined ||
        req.body.address === undefined || req.body.city === undefined ||
        req.body.state === undefined || req.body.zip === undefined ||
        req.body.email === undefined || req.body.username === undefined ||
        req.body.password === undefined)
        return res.json({"message": "The input you provided is not valid"});
    let sql = `INSERT INTO userdata (fname, lname, address, city, state, zip, email, username, password) VALUES  (?,?,?,?,?,?,?,?,?)`;
    connection.query(sql, [req.body.fname, req.body.lname, req.body.address, req.body.city, req.body.state,
        req.body.zip, req.body.email, req.body.username, req.body.password], (err, result) =>{
        if (err)
            return res.json({"message": "The input you provided is not valid"});
        else
            return res.json({"message": req.body.fname + " was registered successfully"});
    });
});

router.post('/login', (req, res) => {
    if (req.body.username === undefined || req.body.password === undefined)
        return res.json({"message": "There seems to be an issue with the username/password combination that you entered"});
    connection.query('SELECT * FROM userdata WHERE username = ?', [req.body.username], (err, result) => {
        if (err) throw(err);
        if (result.length > 0 && result[0].password === req.body.password){
            req.session.user = {
                name: req.body.username,
                id: result[0].id
            };
            return res.json({"message": "Welcome " + result[0].fname});
        }
        else
            return res.json({"message": "There seems to be an issue with the username/password combination that you entered"});
    });
});

router.post('/logout', (req, res) => {
    if (req.session.user === undefined){
        return res.json({"message": "You are not currently logged in"});
    }
    else {
        req.session.destroy();
        return res.json({"message": "You have been successfully logged out"});
    }
});

router.post('/updateInfo', (req, res) => {
    if (req.session.user === undefined) {
        return res.json({"message": "You are not currently logged in"});
    }
    connection.query('SELECT * FROM userdata WHERE username = ?', [req.body.username], (err, result1) => {
        if (req.body.username === undefined || result1.length <= 0 || req.body.username === req.session.user.name) {
            let sql = `UPDATE userdata SET `;
            let updateFlag = 0;
            for (property of Object.keys(req.body)) {
                if (req.body[property] === undefined || req.body[property] === "")
                    continue;
                else {
                    updateFlag = 1;
                    sql += property + `="` + req.body[property] + `", `;
                }
            }
            if(updateFlag == 1) {
                sql = sql.substr(0, sql.length - 2);
                sql += ` WHERE id = ` + req.session.user.id;
                // console.log(sql);
                connection.query(sql, [], (err) => {
                    if (err) throw(err);
                });
                connection.query('SELECT * FROM userdata WHERE id = ?', [req.session.user.id], (err, result) => {
                    if (err) throw(err);
                    req.session.user.name = result[0].username;
                    return res.json({"message": result[0].fname + " your information was successfully updated"});
                });
            }
            else{
                return res.json({"message": "The input you provided is not valid"});
            }
        }
        else
            return res.json({"message": "The input you provided is not valid"});
    });
});

module.exports = router;