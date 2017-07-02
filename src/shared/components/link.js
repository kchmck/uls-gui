import h from "inferno-hyperscript";

const handleClick = fn => e => {
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

    fn(el.pathname);

    e.preventDefault();
};

const historyPush = hist => newLoc => {
    let loc = hist.location;

    if (typeof newLoc === "string") {
        loc.pathname = newLoc;
    } else {
        Object.assign(loc, newLoc);
    }

    hist.push(loc);
};

export const Link = (props, {hist}) => (
    h("a", Object.assign(props, {onClick: handleClick(historyPush(hist))}))
);
