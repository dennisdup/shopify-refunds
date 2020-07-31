import {
    ProgressBar
} from '@shopify/polaris';

class ProgressShow extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <h2>Refunding orders...</h2>
                <h2 style={{float: 'right'}}>{this.props.completed_number} of {this.props.total_number} complete</h2>
                <ProgressBar progress={this.props.progressPos} size="large" />
            </div>
        );
    }
}

export default ProgressShow;