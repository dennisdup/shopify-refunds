const Router  = require('koa-router');
const queries = require('../db/queries/subscription_list');
const router  = new Router();
const getSubscriptionUrl = require('../getSubscriptionUrl');
const cancelSubscriptionUrl = require('../cancelSubscriptionUrl');

const BASE_URL = `/api/subscription`;

/**
 * Get the Billing status.
 */
router.get(BASE_URL, async(ctx) => {
    try{
      const subscription = await queries.getSubscriptions(ctx.session.shop);
      if (subscription.length !== 0 && subscription[0].subscription_id !== '0') {
        const upgrade_id = parseInt(subscription[0].subscription_id, 10);
        let response = await fetch(`https://${ctx.session.shop}/admin/api/2020-04/recurring_application_charges/${upgrade_id}.json`, {
          method: 'get',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': ctx.session.accessToken,
          }
        })
        let responseJSON = await response.json();

        if (responseJSON.recurring_application_charge.status === 'active') {
          ctx.body = {
            status: 'success',
            trial_msg: false
          }
          return;
        }
        ctx.body = {
          status: 'success',
          redirect_url: ctx.cookies.get("confirmationURL")
        }
        return;
      } else if (subscription.length === 0) {
        await queries.addSubscription({
          store_url: ctx.session.shop,
          trial_count: 10,
          subscription_id: 0
        })
      }

      ctx.body = {
        status: 'success',
        trial_msg: true
      }
      return;
    } catch(err) {
        console.log(err);
    }
})

/**
 * Redirect to the billing windows when the button is clicked.
 */
router.get(`${BASE_URL}/redirect`, async(ctx) => {
    try{
        const res = await getSubscriptionUrl(ctx);
        const subscription = await queries.getSubscriptions(ctx.session.shop);
        await queries.updateCount(ctx.session.shop, subscription[0]);
        ctx.body = {
          status: 'success',
          confirmationUrl: res.confirmationUrl
        }
    } catch (err) {
        console.log(err);
    }
})

/**
 * Redirect to the billing windows when the button is clicked.
 */
router.get(`${BASE_URL}/cancelRedirect`, async(ctx) => {
  try{
      const response = await queries.getSubscriptions(ctx.session.shop);
      const res = await cancelSubscriptionUrl(ctx, `gid://shopify/AppSubscription/+${response[0].subscription_id}`);
      await queries.updateCount(ctx.session.shop, {subscription_id: 0});
      ctx.body = {
        status: 'success'
      }
  } catch (err) {
      console.log(err);
  }
})

/**
 * Redirect to the billing windows when the button is clicked.
 */
router.get(`${BASE_URL}/orderRedirect`, async(ctx) => {
  try{
      ctx.body = {
        status: 'success',
        redirect_url: `https://${ctx.session.shop}/admin/orders`
      }
  } catch (err) {
      console.log(err);
  }
})

/**
 * Activate action
 */
router.get(`${BASE_URL}/activatecharge`, async(ctx) => {
  try{

    /**
     * get a specific recurring charge.
     */
    response = await fetch(`https://${ctx.session.shop}/admin/api/2020-04/recurring_application_charges/${ctx.query.charge_id}.json`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ctx.session.accessToken,
      }
    })
    responseJSON = await response.json();
    const subscription = await queries.getSubscriptions(ctx.session.shop);
    subscription[0].subscription_id = responseJSON.recurring_application_charge.id;
    await queries.updateCount(ctx.session.shop, subscription[0]);
    ctx.redirect('/');

    ctx.body = {
      status: 'success'
    }
  } catch (err) {
      console.log(err);
  }
})
module.exports = router;