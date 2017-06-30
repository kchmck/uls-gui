import Component from "inferno-component";

export function createContext(defaultContext) {
    class Provider extends Component {
        render() {
            return this.props.children;
        }

        getChildContext() {
            return defaultContext;
        }
    }

    return Provider;
}
