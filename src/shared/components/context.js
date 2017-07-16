import Component from "inferno-component";

export class Provider extends Component {
    constructor(props) {
        super(props);
        this.defaultContext = props;
    }

    render() {
        return this.props.children;
    }

    getChildContext() {
        return this.defaultContext;
    }
}
