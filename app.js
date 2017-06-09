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
            var date = new Date(data.timestamp);
            // asia timezone 
            date.setHours(date.getHours() + 9);
            format_str = 'YYYY-MM-DD hh:mm:ss';
            format_str = format_str.replace(/YYYY/g, date.getFullYear());
            format_str = format_str.replace(/MM/g, ("0"+(date.getMonth()+1)).slice(-2));// start month 0
            format_str = format_str.replace(/DD/g, ("0" + (date.getDate())).slice(-2));
            format_str = format_str.replace(/hh/g, ("0" + (date.getHours())).slice(-2));
            format_str = format_str.replace(/mm/g, ("0" + (date.getMinutes())).slice(-2));
            format_str = format_str.replace(/ss/g, ("0" + (date.getSeconds())).slice(-2));

            var params = {
                TableName: tableName,
                Item: {
                    "date_id": format_str,
                    "price" : data.ltp
                }
            }
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