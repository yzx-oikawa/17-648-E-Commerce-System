var connection = require('../db').connection;
var express = require('express');
var router = express.Router();

router.post('/buyProducts', (req, res) => {
    if (req.session.user === undefined)
        return res.json({"message": "You are not currently logged in"});
    if (req.body.products === undefined || req.body.products.length == 0)
        return res.json({"message": "There are no products that match that criteria"});
    const purchaseId = req.session.user.name + new Date().getTime();
    let sql = `SELECT asin FROM productdata WHERE asin IN (`;
    let countMap = new Map();
    for (product of req.body.products) {
        if (product.asin === undefined)
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

router.post('/productsPurchased', (req, res) => {
    if (req.session.user === undefined)
        return res.json({"message": "You are not currently logged in"});
    if (req.session.user.name !== "jadmin")
        return res.json({"message": "You must be an admin to perform this action"});
    if (req.body.username === undefined)
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

router.post('/getRecommendations', (req, res) => {
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

module.exports = router;
