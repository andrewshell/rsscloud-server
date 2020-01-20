(function () {
    "use strict";

    const getRandomPassword = require('./get-random-password'),
        querystring = require('querystring'),
        request = require('request-promise-native');

    async function notifyOneChallenge(resourceUrl, apiurl) {
        const challenge = getRandomPassword(20),
            testUrl = apiurl + '?' + querystring.stringify({
                'url': resourceUrl,
                'challenge': challenge
            }),
            res = await request({
                uri: testUrl,
                resolveWithFullResponse: true
            });

        if (res.statusCode < 200 || res.statusCode > 299 || res.body !== challenge) {
            throw new Error('Notification Failed');
        }
    }

    module.exports = notifyOneChallenge;
}());
