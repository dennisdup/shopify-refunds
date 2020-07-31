require('isomorphic-fetch');
const dotenv = require('dotenv');
const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const next = require('next');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const { ApiVersion } = require('@shopify/koa-shopify-graphql-proxy');
const session = require('koa-session');

dotenv.config();
const { default: graphQLProxy } = require('@shopify/koa-shopify-graphql-proxy');
const Router = require('koa-router');
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY } = process.env;

const indexRoutes = require('./routes/index');
const refundsRoutes = require('./routes/refunds');
const subscriptionRoutes = require('./routes/subscription');
const gpdrRoutes = require('./routes/gpdr');

const dbUtils = require('./db/queries/db_utils');

app.prepare().then(() => {
  // first check the database connection
  dbUtils.checkConnection();

  const server = new Koa();
  const router = new Router();
  server.use(cors());
  server.use(session({ secure: true, sameSite: 'none' }, server));
  server.keys = [SHOPIFY_API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: ['read_products', 'write_products', 'write_orders', 'read_orders'],
      accessMode: 'offline',
      async afterAuth(ctx) {
        const { shop, accessToken } = ctx.session;

        ctx.cookies.set('shopOrigin', shop, {
          httpOnly: false,
          secure: true,
          sameSite: 'none'
        });
        ctx.cookies.set('accessToken', accessToken, {
          httpOnly: false,
          secure: true,
          sameSite: 'none'
        });
        ctx.redirect('/');
      },
    }),
  );

  server.use(graphQLProxy({ version: ApiVersion.October19 }));

  server.use(bodyParser());
  server.use(indexRoutes.routes());
  server.use(refundsRoutes.routes());
  server.use(subscriptionRoutes.routes());
  server.use(gpdrRoutes.routes());


  router.get('*', verifyRequest(), async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });

  server.use(router.allowedMethods());
  server.use(router.routes());

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});