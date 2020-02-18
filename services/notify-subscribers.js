(function () {
    "use strict";

    const appMessages = require('./app-messages'),
        logEvent = require('./log-event'),
        moment = require('moment'),
        mongodb = require('./mongodb'),
        notifyOne = require('./notify-one'),
        sprintf = require('sprintf-js').sprintf,
        url = require('url');

    async function fetchSubscriptions(resourceUrl) {
        const subscriptions = await mongodb.get('rsscloud')
            .collection('subscriptions')
            .findOne({
                _id: resourceUrl
            });

        return subscriptions || { _id: resourceUrl, pleaseNotify: [] };
    }

    async function upsertSubscriptions(subscriptions) {
        await mongodb.get('rsscloud')
            .collection('subscriptions')
            .replaceOne(
                { _id: subscriptions._id },
                subscriptions,
                { upsert: true }
            );
    }

    async function notifySubscribers(resourceUrl) {
        const subscriptions = await fetchSubscriptions(resourceUrl);

        for (let subscription of subscriptions.pleaseNotify) {
            const apiurl = subscription.url,
                startticks = moment().format('x'),
                parts = url.parse(apiurl),
                notifyProcedure = false,
                protocol = 'http-post';

            console.log(apiurl);

            try {
                await notifyOne(notifyProcedure, apiurl, protocol, resourceUrl);

                subscription.ctUpdates += 1;
                subscription.ctConsecutiveErrors = 0;
                subscription.whenLastUpdate = moment().utc().format();

                await logEvent(
                    'Notify',
                    sprintf(appMessages.log.notify, apiurl, parts.host, resourceUrl, parts.protocol),
                    startticks
                );
            } catch (err) {
                console.error(err.message);

                subscription.ctErrors += 1;
                subscription.ctConsecutiveErrors += 1;
                subscription.whenLastError = moment().utc().format();

                await logEvent(
                    'NotifyFailed',
                    sprintf(appMessages.log.notifyFailed, apiurl, parts.host, resourceUrl, parts.protocol),
                    startticks
                );
            }
        }

        console.log('upserting subscriptions');

        await upsertSubscriptions(subscriptions);

        console.log('upserted subscriptions');
    }

    module.exports = notifySubscribers;
}());
