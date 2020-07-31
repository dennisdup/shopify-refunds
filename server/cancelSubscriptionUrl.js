/**
 * Query which is used upgrad the app.
 */

const cancelSubscriptionUrl = async (ctx, subscriptionId) => {
  console.log(subscriptionId);
    const query = JSON.stringify({
      query: `mutation {
        appSubscriptionCancel(
            id: "${subscriptionId}"
          ) {
              userErrors {
                field
                message
              }
          }
      }`
    });

    try{
      const response = await fetch(`https://${ctx.session.shop}/admin/api/2019-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "X-Shopify-Access-Token": ctx.session.accessToken,
        },
        body: query
      })
    
      const responseJson = await response.json();
      console.log(responseJson);
      return responseJson;
    } catch (err) {
      console.log(err);
    }

  };
  
  module.exports = cancelSubscriptionUrl;