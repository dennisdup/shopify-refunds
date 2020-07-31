import { Page, Modal, Checkbox, TextField, Button, Layout, ProgressBar, Banner } from '@shopify/polaris';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import BannerShow from '../components/BannerShow';
import ProgressShow from '../components/ProgressShow';

import './settings.css';

const REFUND_LIMIT = 10;
const GET_ORDER_DETAIL = gql`
query getOrderDetail($orderId: ID!, $cursor: String) {
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
}
`;

class Index extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showMainWind: false,
      restockChecked: true,
      refundChecked: true,
      notificationChecked: true,
      textFieldValue: "",
      orderCount: 0,
      openModel: false,
      openWarningModel: false,
      progressPos: 0,
      progressCalcPos: 0,
      progressfirstPos: 0,
      base_shop: '',
      total_Price: 0,
      shipping_Price: 0,
      non_shipping_Price: 0,
      left_trial_order_count: REFUND_LIMIT,
      refund_list: [],
      app_paid_flag: false,
      isProcessFinished: false,
      count_change_warning_flag: false
    };

    this.handleRestockChange = this.handleRestockChange.bind(this);
    this.handleShippingChange = this.handleShippingChange.bind(this);
    this.handleNotificationChange = this.handleNotificationChange.bind(this);
    this.handleTextFieldChange = this.handleTextFieldChange.bind(this);
    this.handleSaveBtn = this.handleSaveBtn.bind(this);
    this.handleCancelBtn = this.handleCancelBtn.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleSubscriptionBtn = this.handleSubscriptionBtn.bind(this);
    this.handleCloseWarningModal = this.handleCloseWarningModal.bind(this);
  }

  componentDidMount () {
    fetch("/api/subscription")
    .then(res => res.json())
    .then(
      (result) => {
        if (result.redirect_url !== undefined) {
          window.top.location.href = result.redirect_url;
          return;
        }
        if (result.trial_msg === false) {
          this.setState({app_paid_flag: true})
        } else {
          this.setState({app_paid_flag: false})
        }
      },
      (error) => {
        console.log(error);
      }
    )

    fetch("/api/refund_lists")
    .then(res => res.json())
    .then(
      async (result) => {
        let order_temp_lists = [];
        this.setState({base_shop: result.base_shop});
        this.setState({left_trial_order_count: result.left_trial_order_count});
        
        for (let i = 0 ; i < result.data.length ; i ++) {
        
          try{
            const response = await fetch(`/api/refund_lists/${i}`);
            const responseJson = await response.json();
            let temp = 0.0 + parseFloat(this.state.non_shipping_Price).toFixed(2) * 1.0 + parseFloat(responseJson.price).toFixed(2) * 1.0;
            this.setState({non_shipping_Price: temp});
            temp = 0.0 + parseFloat(this.state.shipping_Price).toFixed(2) * 1.0 + parseFloat(responseJson.shipping_price).toFixed(2) * 1.0;
            this.setState({shipping_Price: temp});
            this.setState({progressfirstPos: 100.0 / result.data.length * (i + 1)});

            if (parseFloat(responseJson.price).toFixed(2) * 1.0 !== 0) {
              order_temp_lists.push(result.data[i]);
            } else {
              this.setState({count_change_warning_flag: true});
            }
          } catch(err) {
            console.log("123ERROR", err, result.data[i]);
          }
        }

        this.setRefundList(order_temp_lists);
        
        this.setState({total_Price: this.state.non_shipping_Price});
        setTimeout(function() { //Start the timer
          this.setState({showMainWind: true});
        }.bind(this), 1000)
      },
      (error) => {
        console.log(error);
      }
    )
  }

  getListfromStore() {
    if (this.state.progressCalcPos !== 0)
      return;
    const refund_list = this.state.refund_list;
    return(
      refund_list.map((list, index) => {
        const orderId = `gid://shopify/Order/${list}`;
        if (this.state.openModel) 
        {
          return (
            <Query key={index} query={GET_ORDER_DETAIL} variables={{ orderId }}>
              {({ data, loading, error, fetchMore }) => {
                if (loading) return <div></div>;
                if (error) return <div>{error.message}</div>;
                
                if (data.order.lineItems.pageInfo.hasNextPage) {
                  fetchMore({
                    variables: {
                      cursor:
                        data.order.lineItems.edges[data.order.lineItems.edges.length - 1].cursor
                    },
                    updateQuery: (previousResult, { fetchMoreResult }) => {
                      let combinedData = {
                        order: {
                          lineItems: {
                            pageInfo: { ...fetchMoreResult.order.lineItems.pageInfo },
                            edges: [
                              ...previousResult.order.lineItems.edges,
                              ...fetchMoreResult.order.lineItems.edges
                            ],
                            __typename: fetchMoreResult.order.lineItems.__typename
                          }
                        }
                      };
                      return combinedData;
                    }
                  });
                }
                const refundLineItems = data.order.lineItems.edges.map((dat) => {
                  return {
                    lineItemId: dat.node.id,
                    quantity: dat.node.refundableQuantity,
                    restockType: this.state.restockChecked ? "return" : "no_restock"
                  }
                });
                const refundQueryInput = {
                  orderId: list,
                  refundLineItems: refundLineItems,
                  notify: true,
                  shipping: {
                    fullRefund: true
                  }
                }
                this.refundFunc(refundQueryInput);
                return (<div></div>);
              }}
            </Query>
          );
        } else {
          return (
            <div key={index}></div>
          );
        }
      })
    )
  }

  refundFunc(opts) {
    const refund_body = {
      opts,
      refundChecked : this.state.refundChecked,
      notificationChecked : this.state.notificationChecked,
      textFieldValue : this.state.textFieldValue === '' ? this.formatDate() : this.state.textFieldValue
    }
    fetch(`/api/refund_lists/refund`, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(refund_body)
    })
    .then(res => res.json())
    .then(
      (result) => {
        let size = this.state.refund_list.length;
        this.setState({progressCalcPos: this.state.progressCalcPos + 1});
        this.setState({progressPos: this.state.progressCalcPos / size * 100});
        if (this.state.orderCount > 0) {
          this.setState({orderCount: this.state.orderCount - 1});
        }
        if (this.state.progressPos === 100) {
          this.setState({isProcessFinished: true});
          setTimeout(function() { //Start the timer
            this.setState({openModel: false});
          }.bind(this), 1000)
        }
      },
      (error) => {
        console.log(error);
      }
    )
  }

  setRefundList(data) {
    this.setState({refund_list: data});
    this.setState({orderCount: data.length});
  }

  handleSubscriptionBtn(e) {
    fetch("/api/subscription/redirect")
    .then(res => res.json())
    .then(
      (result) => {
        window.top.location.href = result.confirmationUrl;
      },
      (error) => {
        console.log(error);
      }
    )
  }

  handleRestockChange() {
    this.setState({restockChecked: !this.state.restockChecked});
  }

  handleShippingChange() {
    this.setState({refundChecked: !this.state.refundChecked});
    if (this.state.refundChecked === true) {
      this.setState({total_Price: this.state.shipping_Price});
    } else {
      this.setState({total_Price: this.state.non_shipping_Price});
    }
  }

  handleNotificationChange() {
    this.setState({notificationChecked: !this.state.notificationChecked});
  }

  handleTextFieldChange(e) {
    this.setState({textFieldValue: e});
  }

  handleSaveBtn() {
    const size = this.state.refund_list.length;
    if (this.state.app_paid_flag === true || size <= this.state.left_trial_order_count) {
      this.setState({openModel: true});
    }
    else {
      this.setState({openWarningModel: true});
    }
  }

  handleCancelBtn() {
    fetch("/api/refund_lists/cancel", {
      method: 'delete'
    })
    .then(res => res.json())
    .then(
      (result) => {
        this.setRefundList([]);
        this.setState({total_Price: 0});
      },
      (error) => {
        console.log(error);
      }
    )
  }

  handleCloseWarningModal(e) {
    this.setState({openWarningModel: false});
  }

  handleCloseModal(e) {
    if (this.state.progressPos === 100) {
      this.setState({openModel: false});
    }
  }

  formatDate() {
    const months = ["JAN", "FEB", "MAR","APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    let current_datetime = new Date()
    let formatted_date = "Bulk refund - " + months[current_datetime.getMonth()] + " " + current_datetime.getDate() + ", " + current_datetime.getFullYear();
    return formatted_date;
  }

  formatCompleteDate() {
    const months = ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let current_datetime = new Date();
    let hour = current_datetime.getHours();
    let am_pm = "am";
    if (hour > 12) {
      hour -= 12;
      am_pm = "pm";
    }
    let formatted_date = months[current_datetime.getMonth()] + " " + current_datetime.getDate() + ", " + hour + ":" + current_datetime.getMinutes() + am_pm;
    return formatted_date;
  }

  render() {
    const title = `Refund $${this.state.total_Price} from ${this.state.orderCount} Orders`;
    const openModel = this.state.openModel;
    const openWarningModel  = this.state.openWarningModel;
    let progressPos = this.state.progressPos;
    const isProcessFinished = this.state.isProcessFinished;
    const size = this.state.refund_list.length;
    const app_paid_flag = this.state.app_paid_flag;
    const left_trial_order_count = this.state.left_trial_order_count;
    const count_change_warning_flag = this.state.count_change_warning_flag;

    if (this.state.showMainWind === false) {
      return (
        <Page
          title="Bulk Refund Orders"
        >
          <h2 style={{marginBottom: '10px'}}>Loading orders to refund...</h2>
          <ProgressBar progress={this.state.progressfirstPos} size="small" />
        </Page>
      )
    }
    return (
      <div>
        <Page>
          <BannerShow openModal={this.state.openModel} isTrial={!this.state.app_paid_flag} isProcessFinished={this.state.isProcessFinished} refundedMoney={this.state.total_Price} refundedOrders={this.state.refund_list.length} refundedDate={this.formatCompleteDate()} isTrialLeftOrder={this.state.left_trial_order_count} isTrialLimitOrder={REFUND_LIMIT} />
        </Page>
        {openModel === true ?
          (
            <Page>
              {this.getListfromStore()}
              <ProgressShow completed_number={this.state.progressCalcPos} total_number={this.state.refund_list.length} progressPos={progressPos}/>
            </Page>
          ) : isProcessFinished === true || (app_paid_flag !== true && size > left_trial_order_count) ? (
          <div></div>
          ) : (
            <div>
            {count_change_warning_flag === true ? (
            <Page>
              <Banner
                title="Refunds can only be issued to paid orders"
                status="warning"
              >
                <p>
                    Some of the orders you selected were already refunded or are pending. Refunds can only be issued to <b>paid</b> orders so those that do not apply have been removed.
                </p>
              </Banner>
            </Page>
            ) : (
              <div></div>
            )}
        <Page
          title={title}
          separator
        >
          <Layout>
            <Layout.Section>
              <p className="header-margin">
                Issue a full refund for the {this.state.orderCount} selected orders. Partial refunds are not supported.
              </p>
              <p className="header-margin">
                <Checkbox
                  label="Restock Items"
                  checked={this.state.restockChecked}
                  onChange={this.handleRestockChange}
                />
              </p>
              
              <p className="header-margin">
                <Checkbox
                  label="Refund Shipping"
                  checked={this.state.refundChecked}
                  onChange={this.handleShippingChange}
                />
              </p>
              
              <p className="header-margin">
                <Checkbox
                  label="Send customer notification email"
                  checked={this.state.notificationChecked}
                  onChange={this.handleNotificationChange}
                />
              </p>

              <TextField
                label="Internal Note for Refund (customer will not see this)"
                value={this.state.textFieldValue}
                onChange={this.handleTextFieldChange}
                placeholder= {this.formatDate()}
              />
            </Layout.Section>
            
            <Layout.Section>
              <div>
                <div className="button-group-right button-margin-left">
                  {
                    this.state.orderCount > 0 ? 
                    <Button primary onClick={this.handleSaveBtn} >Save</Button> : 
                    <Button primary onClick={this.handleSaveBtn} disabled>Save</Button>
                  }
                </div>
                <div className="button-group-right button-margin-left">
                  <Button onClick={this.handleCancelBtn}>Cancel</Button>
                </div>
              </div>
            </Layout.Section>
          </Layout>
          <Modal
            open={openWarningModel}
            onClose={this.handleCloseWarningModal}
            title="Please upgrade your plan."
          >
            <Modal.Section>
                Trial will only refund {REFUND_LIMIT} orders.
            </Modal.Section>
          </Modal>
        </Page>
            </div>
        )}
      </div>
    );
  }
}

export default Index;