console.log('Loading');

exports.handler = function (event, context, callback) {

    if (event != null) {
        console.log('event = ' + JSON.stringify(event));
    }
    else {
        console.log('No event object');
    }

    callback(null, 'Hello World');  // SUCCESS with message
};
