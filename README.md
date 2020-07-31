# shopify_refunds

Shopify public application for bulk refund system. This project is built with React, Polaris, Node.js, and Postgres.

## Description

The project is Shopify bulk refund system which allows merchants to select and refund specific orders of interest to them. Merchants can choose refund options as like "Restock Items" and "Refund Shipping". Also enable to send the notification to the customers and leave a note for refund. The app offers a trial where people can bulk refund up to 10 orders for free, and after that it would be $5.99/month.

## Prerequisites

This project uses Postgres for data persistenc. You'll need to install and run the Postgres server. You'll also need Node and npm.

Download the project from this Github repository and install dependencies:

1. Run **npm install** from the root to install main dependencies
2. Expose your application to the Internet using ngrok. See [Shopify's documentation](https://help.shopify.com/api/tutorials/building-public-app) .

## Getting started

The following list of steps will get you ready for development and deployment.

### Step 1: Becoming a Shopify App Developer

If you don't have a Shopify Partner account yet head over to http://shopify.com/partners to create one. You'll need it before you can start developing apps.

Once you have a Partner account create a new application to get an API key and other API credentials.

### Step 2: Configuring your application

When you start ngrok, it'll give you a random subdomain (*.ngrok.io). 

In the project root directory, copy `.env.example` file and create a new file named `.env` and open it in a text editor. 

Login to your Shopify partner account and find your App credentials. Set your API key and App secret in the `.env` file. 

```sh
SHOPIFY_API_KEY='your API key'
SHOPIFY_API_SECRET_KEY='app secret'
``` 

**Your api credentials should not be in source control**. In production, keep your keys in environment variables. 

In your partner dashboard, go to App info. For the App URL, set 

```
https://#{app_url}/
```

Here `app_url` is the root path of your application (the same value as APP_URL in your config file).

For Whistlisted redirection URL, set 

```
https://#{app_url}/auth/callback
```

Also, remember to check `enabled` for the embedded settings.

You can set these URLs in the config file. But, the values in config should match the ones in the partner dashboard. 

And then, you set the app_url in the `.env` file.

```sh
HOST=#{app_url}
``` 

At last, If you are going to test the charge on your shopify store, then you can set the SHOPIFY_TEST_CHARGE to true. The default value is false.

```sh
SHOPIFY_TEST_CHARGE=true
```

### Step 3: Set-up your database

This project uses Postgres for its persistence layer. Create local databases for development and testing.

```sh
CREATE DATABASE refund_system
```

Then add the database configuration to `.env` file.

```sh
POSTGRES_USERNAME='postgres'
POSTGRES_PASSWORD='password'
POSTGRES_DATABASE='refund_system'
POSTGRES_DATABASE_TEST='refund_system_test'
``` 

And then run the Knex migration script in the project root to create a votes table:

```sh
npm install -g knex
knex migrate:latest
```

### Step 4: Run the app on your local machine

For development:
```sh
npm run dev
```

For production:
```sh
npm run build
npm start
```

### Step 5: Extend your app to Shopify admin

Merchants use the Shopify admin to manage the back office operations of their store. They can add products, fulfill orders, manage customers, and more.

1. Find the **Bulk Option** tag and click the **Add a link**
2. Set the **Bulk action label** to "Refund Orders".
3. Set the **Link target URL** to `https://#{app_url}/load`
4. Set the **Page to show link**  to "Orders action drop-down"
5. Save

### Step 6: Install your app on store

In your partner dashboard, scroll down to the **Install your app on a test store** section. Follow those steps. Once you start the installation process, the following will happen:

1. You'll see a screen to confirm the installation, with the scopes you requested.  
2. Once you confirm, you'll have to accept a recurring application charge. It's only a test charge so don't worry. 
3. You'll see the app inside the Shopify admin. You can play with it.  

## Built With

* [React](https://reactjs.org/) - Frontend library
* [Polaris](https://polaris.shopify.com/) - Shopify React UI framework
* [Node.js](https://nodejs.org/en/) - Server
* [Koa](https://koajs.com/) - REST APIs service
* [GraphQL](https://graphql.org/) - Shopify GraphQL Admin APIs
* [PostgreSQL](https://www.postgresql.org/) - Database

