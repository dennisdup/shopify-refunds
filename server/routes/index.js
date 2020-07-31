const Router = require('koa-router');
const router = new Router();

router.get('/api', async (ctx) => {
  ctx.body = {
    status: 'success',
    message: 'API works!'
  };
})

module.exports = router;