import Component from "inferno-component";
import {observer} from "inferno-mobx";
import h from "inferno-hyperscript";

export const Link = observer(class extends Component {
    constructor(props, context) {
        super(props, context);

        this.onClick = this.onClick.bind(this);
    }

    createLoc(commonLoc) {
        let {mergePath, href} = this.props;

        if (mergePath !== undefined) {
            let loc = Object.assign({}, commonLoc);
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

    render() {
        this.loc = this.createLoc(this.context.s.commonLoc);

        return h("a", Object.assign(this.props, {
            href: this.context.hist.createHref(this.loc),
            onClick: this.onClick,
        }));
    }
});
