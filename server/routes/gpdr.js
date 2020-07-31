const Router = require('koa-router');
const router = new Router();

/**
 * handle shopify's customers/redact request
 */
router.get('/customers/redact', async (ctx) => {
  ctx.body = {
    status: 'success',
    message: 'GPDR Customer redact Received'
  };
})
/**
 * handle shopify's shop/redact request
 */
router.get('/shop/redact', async (ctx) => {
  ctx.body = {
    status: 'success',
    message: 'GPDR Shop redact Received'
  };
})
/**
 * handle shopify's customers/data_request request
 */
router.get('/customers/data_request', async (ctx) => {
  ctx.body = {
    status: 'success',
    message: 'GPDR Customer Date Request Received'
  };
})

module.exports = router;