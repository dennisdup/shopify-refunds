const knex = require('../connection');

function checkConnection() {
    knex.raw('SELECT 1').then(() => {
        console.log('> Database connection ready');
        return true
    }).catch(err => {
        throw err
    });
}

module.exports = {
    checkConnection,
};