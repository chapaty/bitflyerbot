var request = require('request');
const async = require("async");


﻿var AWS = require('aws-sdk');
var dynamo = new AWS.DynamoDB.DocumentClient();
var tableName = "bitflyer_history";

exports.handler = function (event, context) {
    var path = '/v1/ticker';
    var query = '?product_code=FX_BTC_JPY';
    var url = 'https://api.bitflyer.jp' + path + query;

    async.waterfall([
        function (next) {
            request(url, function (err, response, payload) {
                console.log(JSON.parse(payload));
                next(null, JSON.parse(payload));
            });
        },
        function (data, next) {
            console.log(data);
            var params = {
                TableName: tableName,
                Item: {
                    "date_id": data.timestamp,
                    "price" : data.ltp
                }
            }
            console.log(params);
            dynamo.put(params, function (err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Added item:", JSON.stringify(data, null, 2));
                }
                next(null);
            });
        }
    ], function (err, res) {
        context.done(null, res);  // SUCCESS with message
    });
  
};