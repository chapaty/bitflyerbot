var request = require('request');
const async = require('async');
﻿var AWS = require('aws-sdk');
var dynamo = new AWS.DynamoDB.DocumentClient();
var tableName = "bitflyer_history";
process.env.TZ = 'Asia/Tokyo';

exports.handler = function (event, context) {
    var path = '/v1/ticker';
    var query = '?product_code=FX_BTC_JPY';
    var url = 'https://api.bitflyer.jp' + path + query;
    var time = '';

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
            format_str = 'YYYY-MM-DD hh:mm:ss';
            format_str = format_str.replace(/YYYY/g, date.getFullYear());
            format_str = format_str.replace(/MM/g, ("0"+(date.getMonth()+1)).slice(-2));// start month 0
            format_str = format_str.replace(/DD/g, ("0" + (date.getDate())).slice(-2));
            format_str = format_str.replace(/hh/g, ("0" + (date.getHours())).slice(-2));
            format_str = format_str.replace(/mm/g, ("0" + (date.getMinutes())).slice(-2));
            format_str = format_str.replace(/ss/g, ("0" + (date.getSeconds())).slice(-2));
            time = format_str;
            var params = {
                TableName: tableName,
                Item: {
                    "date_id": format_str,
                    "price": data.ltp
                }
            }
            dynamo.put(params, function (err, res) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
                } else {
                    console.log("Added item:", JSON.stringify(res, null, 2));
                }
                next(null, data);
            });
        },
        function (data, next) {
            console.log('skype start');
            var params = {
                "client_id": process.env.MICROSOFT_APP_ID,
                "client_secret": process.env.MICROSOFT_APP_PASSWORD,
                "grant_type": "client_credentials",
                "scope": "https%3A%2F%2Fgraph.microsoft.com%2F.default"
            };
            var tmpArr = Array();
            for (var key in params) {
                tmpArr.push(key + "=" + params[key]);
            }
            var setBody = tmpArr.join('&');

            var options = {
                uri: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
                json: true,
                headers: {
                    "Content-type": "application/x-www-form-urlencoded",
                },
                body: setBody
            };

            //トークンチェックリクエスト
            request.post(options, function (error, response, body) {
                var message = {
                    "type": "message/text",
                    "text": "現在(" + time + ")の価格は" + data.ltp + "ビットォォォ！"
                };
                //メッセージ送信リクエスト
                request.post({
                    uri: "https://apis.skype.com/v3/conversations/" + process.env.SKYPE_GROUP_ID + "/activities/",
                    headers: {
                        "Authorization": "Bearer " + body.access_token,
                        "Content-type": "application/json"
                    },
                    json: message
                }, function () {
                    next(null);
                });
            });

        }
    ], function (err, res) {
        context.done(null, res);  // SUCCESS with message
    });
  
};