import {
    Banner
} from '@shopify/polaris';

class BannerShow extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isBannerShow: true,
            isButtonShow: true,
            status: ``,
            title: ``,
            content: ``
        };

        this.handleUpgrade = this.handleUpgrade.bind(this);
    }

    completeSettings() {
        if (this.props.isTrial === false) {
            this.setState({
                isBannerShow: false,
                isButtonShow: false
            });

            if (this.props.isProcessFinished === true) {
                this.setState({
                    isBannerShow: true,
                    title: `Refunds Complete`,
                    status: `info`,
                    content: `${this.props.refundedMoney} was refunded from ${this.props.refundedOrders} orders on ${this.props.refundedDate}.`
                });
            }
        } else {
            this.setState({
                isBannerShow: true,
                isButtonShow: true
            });
            
            if (this.props.isProcessFinished === true) {
                this.setState({
                    title: `Refunds Complete`,
                    status: `info`,
                    content: `${this.props.refundedMoney} was refunded from ${this.props.refundedOrders} orders on ${this.props.refundedDate}. To be able to refund an unlimited numbers of orders at one time, please click below to upgrade your plan.`
                });
            }
            else {
                if (this.props.isTrialLeftOrder === 0) {
                    this.setState({
                        title: `Trial Limit Exceeded`,
                        status: `critical`,
                        content: `You have used all ten of your trial refunds. To refund an unlimited number of orders, please upgrade your plan.`
                    })
                }
                else if (this.props.isTrialLeftOrder === this.props.isTrialLimitOrder) {
                    this.setState({
                        title: `The trial plan of the Bulk Refunds app is limited to a total of ${this.props.isTrialLimitOrder} refunds so you can try out the functionality.`,
                        status: `warning`,
                        content: `Please consider upgrading to refund more than ${this.props.isTrialLimitOrder} orders.`
                    })
                }
                else if (this.props.isTrialLeftOrder >= this.props.refundedOrders) {
                    this.setState({
                        title: `The trial plan of the Bulk Refunds app is limited to a total of ${this.props.isTrialLimitOrder} refunds so you can try out the functionality.`,
                        status: `warning`,
                        content: `You've used ${this.props.isTrialLimitOrder - this.props.isTrialLeftOrder} of your ${this.props.isTrialLimitOrder} trial bulk refunds. Please consider upgrading to be able to refund an unlimited number of orders.`
                    })
                }
                else if (this.props.isTrialLeftOrder < this.props.refundedOrders) {
                    this.setState({
                        title: `There are only ${this.props.isTrialLeftOrder} refund credits left for this trial plan.`,
                        status: `warning`,
                        content: `You do not have enough trial refunds left to refund all the selected orders. Please upgrade your plan to process an unlimited number of refunds at a time.`
                    })
                }
            }
        }
    }

    componentWillReceiveProps() {
        this.completeSettings();
    }

    componentDidMount() {
        this.completeSettings();
    }

    handleUpgrade(e) {
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
    }

    render() {
        if (this.props.openModal === true) {
            return (
                <Banner
                    status="warning"
                >
                    <p>
                        Please wait until all refunds are complete before leaving this page or only some of the refunds will be processed.
                    </p>
                </Banner>
            )
        }
        if (this.state.isBannerShow === false) {
            return (
                <div></div>
            )
        }

        if (this.state.isButtonShow === false) {
            return (
                <Banner
                title={this.state.title}
                status={this.state.status}
                >
                    <p>
                        {this.state.content}
                    </p>
                </Banner>
            );
        }

        return (
            <Banner
            title={this.state.title}
            status={this.state.status}
            action={{content: 'Upgrade Plan', onAction: this.handleUpgrade}}
            >
                <p>
                    {this.state.content}
                </p>
            </Banner>
        );
    }
}

export default BannerShow;