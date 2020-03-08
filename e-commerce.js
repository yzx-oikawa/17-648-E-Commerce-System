var connection = require('./db').connection;
connection.connect();

// var pool = require('./db').pool;
// pool.getConnection(function (dberr, connection) {});

var express = require("express");
var session = require("express-session");

var app = express();
app.use(express.json());
app.use(session({
    secret: 'test secret',
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: 60 * 1000 * 15 } //ms
}));

app.post('/registerUser', (req, res) => {
    if (req.body.fname === undefined || req.body.lname === undefined || req.body.fname === "" || req.body.lname === "" ||
        req.body.address === undefined || req.body.city === undefined || req.body.address === "" || req.body.city === "" ||
        req.body.state === undefined || req.body.zip === undefined || req.body.state === "" || req.body.zip === "" ||
        req.body.email === undefined || req.body.username === undefined || req.body.email === "" || req.body.username === "" ||
        req.body.password === undefined || req.body.password === "")
        return res.json({"message": "The input you provided is not valid"});
    connection.query(`SELECT * FROM userdata WHERE username = ?`, [req.body.username], (err, result) => {
        if (result.length > 0)
            return res.json({"message": "The input you provided is not valid"});
        let sql = `INSERT INTO userdata (fname, lname, address, city, state, zip, email, username, password) VALUES  (?,?,?,?,?,?,?,?,?)`;
        connection.query(sql, [req.body.fname, req.body.lname, req.body.address, req.body.city, req.body.state,
            req.body.zip, req.body.email, req.body.username, req.body.password], (err, result) =>{
            if (err) throw(err);
            return res.json({"message": req.body.fname + " was registered successfully"});
        });
    });
});

app.post('/login', (req, res) => {
    if (req.body.username === undefined || req.body.password === undefined || req.body.username === "" || req.body.password === "")
        return res.json({"message": "There seems to be an issue with the username/password combination that you entered"});
    connection.query('SELECT * FROM userdata WHERE username = ?', [req.body.username], (err, result) => {
        if (err) throw(err);
        if (result.length > 0 && result[0].password === req.body.password){
            const user = {
                name: req.body.username,
                id: result[0].id
            };
            req.session.user = user;
            return res.json({"message": "Welcome " + result[0].fname});
        }
        else
            return res.json({"message": "There seems to be an issue with the username/password combination that you entered"});
    });
});

app.post('/logout', (req, res) => {
    if (req.session.user === undefined){
        return res.json({"message": "You are not currently logged in"});
    }
    else {
        req.session.destroy();
        return res.json({"message": "You have been successfully logged out"});
    }
});

app.post('/updateInfo', (req, res) => {
    if (req.session.user === undefined) {
        return res.json({"message": "You are not currently logged in"});
    }
    connection.query('SELECT * FROM userdata WHERE username = ?', [req.body.username], (err, result1) => {
        if (req.body.username === undefined || req.body.username === "" || result1.length <= 0 || req.body.username === req.session.user.name) {
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
                    console.log(sql);
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

app.post('/addProducts', (req, res) => {
    if (req.session.user === undefined)
        return res.json({"message": "You are not currently logged in"});
    if (req.session.user.name !== "jadmin")
        return res.json({"message": "You must be an admin to perform this action"});
    if (req.body.asin === undefined || req.body.productName === undefined || req.body.asin === "" || req.body.productName === "" ||
        req.body.productDescription === undefined || req.body.group === undefined || req.body.productDescription === "" || req.body.group === "")
        return res.json({"message": "The input you provided is not valid"});
    connection.query(`SELECT * FROM productdata WHERE asin = ?`, [req.body.asin], (err, result) => {
        if (err) throw(err);
        if (result.length > 0)
            return res.json({"message": "The input you provided is not valid"});
        let sql = "INSERT INTO productdata (asin, productName, productDescription, `groups`) VALUES (?,?,?,?)";
        connection.query(sql, [req.body.asin, req.body.productName, req.body.productDescription, req.body.group], (error,) =>{
            if (error) throw(error);
            return res.json({"message": req.body.productName + " was successfully added to the system"});
        });
    });
});

app.post('/modifyProduct', (req, res) => {
    // console.log(req.body.asin+ " "+req.body.productName+" "+ req.body.productDescription +" "+ req.body.group);
    if (req.session.user === undefined)
        return res.json({"message": "You are not currently logged in"});
    if (req.session.user.name !== "jadmin")
        return res.json({"message": "You must be an admin to perform this action"});
    if (req.body.asin === undefined || req.body.productName === undefined || req.body.asin === "" || req.body.productName === "" ||
        req.body.productDescription === undefined || req.body.group === undefined || req.body.productDescription === "" || req.body.group === "")
        return res.json({"message": "The input you provided is not valid"});
    connection.query(`SELECT * FROM productdata WHERE asin = ?`, [req.body.asin], (err, result) => {
        if (result.length > 0){
            let sql = "UPDATE productdata SET productName = ? , productDescription = ?, `groups` = ? WHERE asin = ?";
            connection.query(sql, [req.body.productName, req.body.productDescription, req.body.group, req.body.asin], (err) => {
                if (err) throw(err);
                return res.json({"message": req.body.productName + " was successfully updated"});
            });
        }
        else
            return res.json({"message": "The input you provided is not valid"});
    });
});

app.post('/viewUsers', (req, res) => {
    if (req.session.user === undefined)
        return res.json({"message": "You are not currently logged in"});
    if (req.session.user.name !== "jadmin")
        return res.json({"message": "You must be an admin to perform this action"});
    if (req.body.fname === undefined) req.body.fname = "";
    if (req.body.lname === undefined) req.body.lname = "";
    let sql = `SELECT * FROM userdata WHERE fname LIKE ? AND lname LIKE ?`;
    connection.query(sql, ['%'+req.body.fname+'%', '%'+req.body.lname+'%'], (err, result) => {
        if (err) throw(err);
        if (result.length == 0)
           return res.json({"message": "There are no users that match that criteria"});
        else{
            var resval = {"message": "The action was successful", "user":[]};
            for (user of result){
                resval.user.push({"fname": user.fname, "lname": user.lname, "userId": user.username});
            }
            return res.json(resval);
        }
    });
});

app.post('/viewProducts', (req, res) => {
    let sql = `SELECT * FROM productdata WHERE asin = ? AND (productName LIKE ? OR productDescription LIKE ?) AND groups = ?` ;
    if (req.body.asin === undefined || req.body.asin === "") {
        req.body.asin = "%";
        sql = sql.replace("asin =", "asin LIKE");
    }
    if (req.body.keyword === undefined) req.body.keyword = "";
    if (req.body.group === undefined || req.body.group === "") {
        req.body.group = "%";
        sql = sql.replace("groups =", "groups LIKE");
    }
    connection.query(sql, [req.body.asin, '%'+req.body.keyword+'%', '%'+req.body.keyword+'%', req.body.group], (err, result) => {
        if (err) throw(err);
        if (result.length == 0)
            return res.json({"message": "There are no products that match that criteria"});
        else{
            var resval = {"product":[]};
            for (product of result){
                resval.product.push({"asin": product.asin, "productName": product.productName});
            }
            return res.json(resval);
        }
    });
});

app.post('/buyProducts', (req, res) => {
    if (req.session.user === undefined)
        return res.json({"message": "You are not currently logged in"});
    if (req.body.products === undefined)
        return res.json({"message": "There are no products that match that criteria"});
    const purchaseId = req.session.user.name + new Date().getTime();
    let sql = `SELECT asin FROM productdata WHERE asin IN (`;
    let countMap = new Map();
    for (product of req.body.products) {
        if (product.asin === undefined || product.asin === "")
            continue;
        sql += `"` + product.asin + `", `;
        if(countMap.has(product.asin))
            countMap.set(product.asin, countMap.get(product.asin)+1);
        else
            countMap.set(product.asin, 1);
    }
    sql = sql.substr(0, sql.length - 2);
    sql += `)`;
    connection.query(sql, [], (err, result) => {
        if (err) throw(err);
        if (result.length > 0) {
            for (validAsin of result) {
                connection.query(`INSERT INTO purchaserecord (purchaseid, userid, productid, quantity) VALUES  (?,?,?,?)`,
                    [purchaseId, req.session.user.id, validAsin.asin, countMap.get(validAsin.asin)], (error) => {
                        if (error) throw(error);
                });
            }
            return res.json({"message": "The action was successful"});
        }
        else {
            return res.json({"message": "There are no products that match that criteria"});
        }
    });
});

app.post('/productsPurchased', (req, res) => {
    if (req.session.user === undefined)
        return res.json({"message": "You are not currently logged in"});
    if (req.session.user.name !== "jadmin")
        return res.json({"message": "You must be an admin to perform this action"});
    if (req.body.username === undefined || req.body.username === "")
        return res.json({"message": "There are no users that match that criteria"});
    connection.query(`SELECT id FROM userdata WHERE username = ?`, [req.body.username], (err, resUser) => {
        if (err) throw(err);
        if (resUser.length == 0)
            return res.json({"message": "There are no users that match that criteria"});
        let sql = `SELECT p.productid, d.productName AS name, SUM(p.quantity) AS cnt FROM purchaserecord p ` +
                `JOIN productdata d ON p.productid = d.asin WHERE p.userid = ? GROUP BY p.productid`;
        connection.query(sql, [resUser[0].id], (error, result) => {
            if (error) throw(error);
            // console.log(result);
            if (result.length == 0)
                return res.json({"message": "There are no users that match that criteria"});
            var resval = {"message":"The action was successful", "products":[]};
            for (product of result) {
                resval.products.push({"productName": product.name, "quantity": product.cnt});
            }
            return res.json(resval);
        });
    });
});

app.post('/getRecommendations', (req, res) => {
    if (req.session.user === undefined)
        return res.json({"message": "You are not currently logged in"});
    if (req.body.asin === undefined || req.body.asin === "")
        return res.json({"message": "There are no recommendations for that product"});
    innerSql = `SELECT purchaseid FROM purchaserecord WHERE productid = ?`;
    sql = `SELECT productid, COUNT(productid) AS cnt FROM purchaserecord WHERE productid != ? AND purchaseid IN ( `
        + innerSql + ` ) GROUP BY productid ORDER BY cnt DESC LIMIT 5`;
    connection.query(sql, [req.body.asin, req.body.asin], (err, result) => {
        // console.log(result);
        if(result.length <= 1)
            return res.json({"message": "There are no recommendations for that product"});
        var resval = {"message":"The action was successful", "products":[]};
        for (product of result) {
            resval.products.push({"asin": product.productid});
        }
        return res.json(resval);
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});