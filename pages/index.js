import { EmptyState, Button, Page } from '@shopify/polaris';
import { useEffect, useState } from 'react';

import './index.css';

const img = '/static/refund.png';

function Index() {
  const [subscription, setSubscription] = useState(0);
  useEffect(() => {
    fetch("/api/subscription")
    .then(res => res.json())
    .then(
      (result) => {
        if (result.trial_msg === false) {
          setSubscription(1);
        } else {
          setSubscription(0);
        }
      },
      (error) => {
        console.log(error);
      }
    )
  });

  function handleClick(e) {
    e.preventDefault();
    if (subscription === 0) {
      fetch(`/api/subscription/redirect`)
      .then(res => res.json())
      .then(
        (result) => {
          window.top.location.href = result.confirmationUrl;
        },
        (error) => {
          console.log(error);
        }
      )
    } else {
      fetch(`/api/subscription/cancelRedirect`)
      .then(res => res.json())
      .then(
        (result) => {
          setSubscription(0);
        },
        (error) => {
          console.log(error);
        }
      )
    }
  }

  function handleToOrderClick(e) {
    e.preventDefault();
    fetch(`/api/subscription/orderRedirect`)
    .then(res => res.json())
    .then(
      (result) => {
        window.top.location.href = result.redirect_url;
      },
      (error) => {
        console.log(error);
      }
    )
  }

  return (
    <Page>
      <div className="button-group-right">
        <Button plain onClick={handleClick}>{(subscription===0)?"Upgrade Plan":"Downgrade Plan"}</Button>
      </div>
      <EmptyState
        heading="Bulk Refund Orders Painlessly"
        image={img}
      >
        <p style={{marginBottom: "10px"}}>From the <strong>Orders page</strong> select all the orders you want to refund and click <strong>More Actions > Refund Orders</strong>.</p>
        <Button primary fullWidth={true} onClick={handleToOrderClick}>Select Orders to Refund</Button>
      </EmptyState>
    </Page>
  );
}

export default Index;