/**
 * Query which is used upgrad the app.
 */

const getTotalPrice = async (ctx, orderid) => {
    let sum = 0;
    let shipping_sum = 0;
    let cursor = null;
    const query = {
      query: `query getOrderDetail($orderId: ID!, $cursor: String) {
        order(id: $orderId) {
          name
          physicalLocation {
            id
          }
          lineItems (first:50, after: $cursor){
            pageInfo {
              hasNextPage
              hasPreviousPage
            }
            edges {
              cursor
              node {
                id
                refundableQuantity
              }
            }
          }
        }
      }`,
      variables: {
        orderId: orderid,
        cursor: cursor
      }
    };

    try {
      let refund_line_items = [];
      let responseJson;
    
      do {
        const response = await fetch(`https://${ctx.session.shop}/admin/api/2019-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "X-Shopify-Access-Token": ctx.session.accessToken,
          },
          body: JSON.stringify(query)
        })
      
        responseJson = await response.json();
  //      responseJson.data.order.lineItems.node.edges.map((lineItem) => {
        responseJson.data.order.lineItems.edges.map((lineItem) => {
          refund_line_items.push({
            line_item_id: lineItem.node.id.replace('gid://shopify/LineItem/',''),
            quantity: lineItem.node.refundableQuantity,
            restock_type: 'return'
          });
          query.variables.cursor = lineItem.cursor;
        })
        
      } while (responseJson.data.order.lineItems.pageInfo.hasNextPage);
  
      let headBody = {
        refund: {
          shipping: {
            full_refund: true
          },
          refund_line_items: refund_line_items
        }
      }
  
      /**
       * Calculate API call
       */
      let order_replace_id = orderid.replace('gid://shopify/Order/','');
      let reFundCalc = await fetch(`https://${ctx.session.shop}/admin/api/2020-04/orders/${order_replace_id}/refunds/calculate.json`, {
        method: 'post', 
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ctx.session.accessToken,
        },
        body: JSON.stringify(headBody)
      })
      let resReFundCalc = await reFundCalc.json();
  
      resReFundCalc.refund.transactions.map((transaction) => {
        sum += transaction.amount;
      })
  
      headBody = {
        refund: {
          shipping: {
            amount: 0
          },
          refund_line_items: refund_line_items
        }
      }
  
      /**
       * Calculate API call
       */
      order_replace_id = orderid.replace('gid://shopify/Order/','');
      reFundCalc = await fetch(`https://${ctx.session.shop}/admin/api/2020-04/orders/${order_replace_id}/refunds/calculate.json`, {
        method: 'post', 
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ctx.session.accessToken,
        },
        body: JSON.stringify(headBody)
      })
      resReFundCalc = await reFundCalc.json();
  
      resReFundCalc.refund.transactions.map((transaction) => {
        shipping_sum += transaction.amount;
      })
  
      return {sum, shipping_sum};
    } catch (err) {
      return {sum: 0, shipping_sum: 0};
    }
  };
  
  module.exports = getTotalPrice;