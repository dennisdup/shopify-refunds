/**
 * Query which is used upgrad the app.
 */

const getSubscriptionUrl = async (ctx) => {
    const query = JSON.stringify({
      query: `mutation {
        appSubscriptionCreate(
            name: "Upgrade Preminum Plan"
            returnUrl: "${process.env.HOST}/api/subscription/activatecharge"
            test: ${process.env.SHOPIFY_TEST_CHARGE}
            lineItems: [
            {
              plan: {
                appRecurringPricingDetails: {
                    price: { amount: 5.99, currencyCode: USD }
                }
              }
            }
            ]
          ) {
              userErrors {
                field
                message
              }
              confirmationUrl
              appSubscription {
                id
                status
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
      const confirmationUrl = responseJson.data.appSubscriptionCreate.confirmationUrl;
      const status = responseJson.data.appSubscriptionCreate.appSubscription.status;
      const id = responseJson.data.appSubscriptionCreate.appSubscription.id;
  
      ctx.cookies.set('confirmationURL', confirmationUrl, {
        httpOnly: false,
        secure: true,
        sameSite: 'none'
      });
      return {confirmationUrl, status, id}
    } catch (err) {
      console.log(err);
    }

  };
  
  module.exports = getSubscriptionUrl;