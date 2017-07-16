import Component from "inferno-component";
import h from "inferno-hyperscript";

export class Link extends Component {
    constructor(props, context) {
        super(props, context);

        this.componentWillUpdate(props);
        this.onClick = this.onClick.bind(this);
    }

    createLoc({mergePath, href}) {
        let {hist} = this.context;

        if (mergePath !== undefined) {
            let loc = Object.assign({}, hist.location);
            loc.pathname = mergePath;

            return loc;
        }

        if (href !== undefined) {
            return {pathname: href};
        }

        throw new Error("no valid location form given");
    }

    onClick(e) {
        // Verify left button.
        if (e.button !== 0) {
            return;
        }

        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            return;
        }

        if (e.defaultPrevented) {
            return;
        }

        let el = e.currentTarget;

        if (el.target) {
            return;
        }

        this.context.hist.push(this.loc);

        e.preventDefault();
    }

    componentWillUpdate(newProps) {
        this.loc = this.createLoc(newProps);
    }

    render() {
        return h("a", Object.assign(this.props, {
            href: this.context.hist.createHref(this.loc),
            onClick: this.onClick,
        }));
    }
}
