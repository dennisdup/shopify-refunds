const Router = require('koa-router');
const queries = require('../db/queries/subscription_list');

const router = new Router();
const BASE_URL = `/api/refund_lists`;
const getTotalPrice = require('../getTotalPrice');
let used_order_count = 10;

/**
 * Store the order's ids on the DB and redirect to the homepage.
 */
router.get('/load', async (ctx) => {
  try {
    const subscription = await queries.getSubscriptions(ctx.session.shop);
    if (subscription.length === 0) {
      await queries.addSubscription({
        store_url: ctx.session.shop,
        trial_count: 10,
        subscription_id: 0
      });
    }

    let order_temp_id = [];
    if (Array.isArray(ctx.query['ids[]']) === true)
    {
      order_temp_id = ctx.query['ids[]'];
    } else {
      order_temp_id.push(ctx.query['ids[]']);
    }
    
    await queries.updateCount(ctx.session.shop, {stringarray: order_temp_id});

    ctx.redirect("/settings");
  } catch (err) {
    console.log(err)
  }
})

/**
 * Get order's id lists from DB
 */
router.get(BASE_URL, async (ctx) => {
  try {
    const subscription = await queries.getSubscriptions(ctx.session.shop);
    ctx.body = {
      status: 'success',
      data: subscription[0].stringarray,
      left_trial_order_count: subscription[0].trial_count,
      base_shop: ctx.session.shop
    };
  } catch (err) {
    console.log(err)
  }
})

router.get(`${BASE_URL}/:id`, async (ctx) => {
  try {
    let sum_total = 0.0;
    let sum_shipping_total = 0.0;
    const subscription = await queries.getSubscriptions(ctx.session.shop);

    const orderId = `gid://shopify/Order/${subscription[0].stringarray[ctx.params.id]}`;
    let {sum, shipping_sum} = await getTotalPrice(ctx, orderId);
    sum_total = parseFloat(sum);
    sum_shipping_total = parseFloat(shipping_sum);

    ctx.body = {
      status: 'success',
      price: sum_total,
      shipping_price: sum_shipping_total,
    };
  } catch (err) {
    console.log(err)
  }
})

/**
 * Refunds bulk orders.
 * 1. Calculate the refundable lineItems for each Orders.
 * 2. Create refund with Maximum price.
 */
router.post(`${BASE_URL}/refund`, async (ctx) => {
  try {

    /**
     * Prepare refund line items
     */
    const order_id = ctx.request.body.opts.orderId;
    const refund_line_items = ctx.request.body.opts.refundLineItems.map((lineItem) => ({
      line_item_id: lineItem.lineItemId.replace('gid://shopify/LineItem/',''),
      quantity: lineItem.quantity,
      restock_type: lineItem.restockType // Set Restock option
    }))
    let headBody;
    /**
     * Header for Refund calculation
     */
    if (ctx.request.body.refundChecked === true) {
      // Calculate for full refund
      headBody = {
        refund: {
          shipping: {
            full_refund: true
          },
          refund_line_items: refund_line_items
        }
      }
    } else {
      // Calculate for refund shipping
      headBody = {
        refund: {
          shipping: {
            amount: 0
          },
          refund_line_items: refund_line_items
        }
      }
    }

    /**
     * Calculate API call
     */
    const reFundCalc = await fetch(`https://${ctx.session.shop}/admin/api/2020-04/orders/${order_id}/refunds/calculate.json`, {
      method: 'post', 
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ctx.session.accessToken,
      },
      body: JSON.stringify(headBody)
    })
    const resReFundCalc = await reFundCalc.json();
    let refund_head;
    if (ctx.request.body.refundChecked === true) {
      // Header for Full refund
      refund_head = {
        refund: {
          currency: resReFundCalc.refund.currency,
          notify: ctx.request.body.notificationChecked,
          note: ctx.request.body.textFieldValue,
          shipping: {
            full_refund: true
          },
          refund_line_items: resReFundCalc.refund.refund_line_items.map((lineItem) => ({
            line_item_id: lineItem.line_item_id,
            quantity: lineItem.quantity,
            location_id: lineItem.location_id,
            restock_type: lineItem.restock_type // Set Restock option
          })),
          transactions: resReFundCalc.refund.transactions.map((transactions) => ({
            parent_id: transactions.parent_id,
            amount: transactions.amount,
            kind: "refund",
            gateway: transactions.gateway,
            currency: transactions.currency
          }))
        }
      }
    } else {
      // Header for refund shipping
      refund_head = {
        refund: {
          currency: resReFundCalc.refund.currency,
          notify: ctx.request.body.notificationChecked,
          note: ctx.request.body.textFieldValue,
          shipping: {
            amount: resReFundCalc.refund.shipping.maximum_refundable
          },
          refund_line_items: resReFundCalc.refund.refund_line_items.map((lineItem) => ({
            line_item_id: lineItem.line_item_id,
            quantity: lineItem.quantity,
            location_id: lineItem.location_id,
            restock_type: lineItem.restock_type // Set Restock option
          })),
          transactions: resReFundCalc.refund.transactions.map((transactions) => ({
            parent_id: transactions.parent_id,
            amount: transactions.amount,
            kind: "refund",
            gateway: transactions.gateway,
            currency: transactions.currency
          }))
        }
      }
    }

    /**
     * Call Refund API
     */

    const resultRefund = await fetch(`https://${ctx.session.shop}/admin/api/2020-04/orders/${order_id}/refunds.json`, {
      method: 'post', 
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': ctx.session.accessToken,
      },
      body: JSON.stringify(refund_head)
    })
    const resultJson = await resultRefund.json();
    const subscription = await queries.getSubscriptions(ctx.session.shop);
    if (subscription.length !== 0 && subscription[0].trial_count !== 0) {
      await queries.updateCount(ctx.session.shop, {trial_count: subscription[0].trial_count - 1});
    }

    ctx.status = 200;
    ctx.body = {
      status: 'success',
      flag: 1
    };

  } catch (err) {
    console.log(err);
  }
})

/**
 * Clear All ids on DB.
 */

router.delete(`${BASE_URL}/cancel`, async (ctx) => {
  try {
    const order_ids = [];    
    const response = await queries.updateCount(ctx.session.shop, {stringarray: order_ids});

    if (response.length) {
      ctx.status = 200;
      ctx.body = {
        status: 'success',
        data: response[0].stringarray
      };
    } else {
      ctx.status = 404;
      ctx.body = {
        status: 'error',
        message: 'That lists does not exist.'
      };
    }
  } catch (err) {
    console.log(err)
  }
})

module.exports = router;