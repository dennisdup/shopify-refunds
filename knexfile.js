const path = require('path');
const BASE_PATH = path.join(__dirname, 'server', 'db');

require('dotenv').config();
const { POSTGRES_URI, POSTGRES_USERNAME, POSTGRES_PASSWORD, POSTGRES_DATABASE, POSTGRES_DATABASE_TEST } = process.env;

var postgres_host = `postgres://${POSTGRES_USERNAME}:${POSTGRES_PASSWORD}@34.70.76.105:5432`;

console.log('POSTGRES_URI', POSTGRES_URI)

module.exports = {
  test: {
    client: 'pg',
    connection: `${postgres_host}/${POSTGRES_DATABASE_TEST}`,
    migrations: {
      directory: path.join(BASE_PATH, 'migrations')
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds')
    }
  },
  development: {
    client: 'pg',
    connection: POSTGRES_URI,
    migrations: {
      directory: path.join(BASE_PATH, 'migrations')
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds')
    }
  },
  production: {
    client: 'pg',
    connection: POSTGRES_URI,
    migrations: {
      directory: path.join(BASE_PATH, 'migrations')
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds')
    }
  }
};