const TABLE_NAME = 'subscription_list';

const knex = require('../connection');

function checkConnection() {
    knex.raw('SELECT 1').then(() => {
        console.log('db connected');
        return true
    }).catch(err => {
        throw err
    });
}

function getAllSubscriptions() {
    return knex(TABLE_NAME)
        .select('*');
}

function getSubscriptions(storeUrl, trialCount, subscriptionId, createdAt) {
    var subscription = knex(TABLE_NAME).select('*');
    if (storeUrl) {
        subscription = subscription.where({ store_url: storeUrl });
    }
    if (trialCount) {
        subscription = subscription.where({ trial_count: trialCount });
    }
    if (subscriptionId) {
        subscription = subscription.where({ subscription_id: subscriptionId });
    }
    return subscription;
}

function addSubscription(subscription) {
    return knex(TABLE_NAME)
        .insert(subscription)
        .returning('*');
}

function updateCount(storeUrl, subscription) {
    return knex(TABLE_NAME)
        .update(subscription)
        .where({ store_url: storeUrl })
        .returning('*');
}

function deleteVote(id) {
    return knex(TABLE_NAME)
        .del()
        .where({ store_url: storeUrl })
        .returning('*');
}

module.exports = {
    getAllSubscriptions,
    getSubscriptions,
    addSubscription,
    updateCount,
    deleteVote,
};