var connection = require('../db').connection;
var express = require('express');
var router = express.Router();

router.post('/addProducts', (req, res) => {
    if (req.session.user === undefined)
        return res.json({"message": "You are not currently logged in"});
    if (req.session.user.name !== "jadmin")
        return res.json({"message": "You must be an admin to perform this action"});
    if (req.body.asin === undefined || req.body.productName === undefined ||
        req.body.productDescription === undefined || req.body.group === undefined)
        return res.json({"message": "The input you provided is not valid"});

    let sql = "INSERT INTO productdata (asin, productName, productDescription, `groups`) VALUES (?,?,?,?)";
    connection.query(sql, [req.body.asin, req.body.productName, req.body.productDescription, req.body.group], (err,) =>{
        if (err)
            return res.json({"message": "The input you provided is not valid"});
        else
            return res.json({"message": req.body.productName + " was successfully added to the system"});
    });
});

router.post('/modifyProduct', (req, res) => {
    // console.log(req.body.asin+ " "+req.body.productName+" "+ req.body.productDescription +" "+ req.body.group);
    if (req.session.user === undefined)
        return res.json({"message": "You are not currently logged in"});
    if (req.session.user.name !== "jadmin")
        return res.json({"message": "You must be an admin to perform this action"});
    if (req.body.asin === undefined || req.body.productName === undefined ||
        req.body.productDescription === undefined || req.body.group === undefined)
        return res.json({"message": "The input you provided is not valid"});
    connection.query(`SELECT * FROM productdata WHERE asin = ?`, [req.body.asin], (err, result) => {
        if (result.length > 0){
            let sql = "UPDATE productdata SET productName = ? , productDescription = ?, `groups` = ? WHERE asin = ?";
            connection.query(sql, [req.body.productName, req.body.productDescription, req.body.group, req.body.asin], (error) => {
                if (error)
                    return res.json({"message": "The input you provided is not valid"});
                else
                    return res.json({"message": req.body.productName + " was successfully updated"});
            });
        }
        else
            return res.json({"message": "The input you provided is not valid"});
    });
});

router.post('/viewUsers', (req, res) => {
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

router.post('/viewProducts', (req, res) => {
    let sql = "SELECT * FROM productdata WHERE asin = ? AND (productName LIKE ? OR productDescription LIKE ?) AND `groups` = ?" ;
    if (req.body.asin === undefined || req.body.asin === "") {
        req.body.asin = "%";
        sql = sql.replace("asin =", "asin LIKE");
    }
    if (req.body.keyword === undefined) req.body.keyword = "";
    if (req.body.group === undefined || req.body.group === "") {
        req.body.group = "%";
        sql = sql.replace("`groups` =", "`groups` LIKE");
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

module.exports = router;