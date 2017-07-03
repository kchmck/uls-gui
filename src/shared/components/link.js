import Component from "inferno-component";
import h from "inferno-hyperscript";

export class Link extends Component {
    constructor(props, context) {
        super(props, context);

        this.onClick = this.onClick.bind(this);
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

        this.historyPush(el.pathname);

        e.preventDefault();
    }

    historyPush(newLoc) {
        let loc = this.context.hist.location;

        if (typeof newLoc === "string") {
            loc.pathname = newLoc;
        } else {
            Object.assign(loc, newLoc);
        }

        this.context.hist.push(loc);
    }

    render() {
        return h("a", Object.assign(this.props, {
            onClick: this.onClick,
        }));
    }
}
