import classNames from "classnames";
import h from "inferno-hyperscript";
import {observer} from "inferno-mobx";
import {sprintf} from "sprintf-js";

import {Link} from "./link";
import {createContext} from "./context";
import {hsvToRgb} from "../util";

function calcPos(loc, proj) {
    return proj.fromLatLngToDivPixel({
        lat: () => loc.lat + loc.jitterLat,
        lng: () => loc.lng + loc.jitterLng,
    });
}

function calcBackground(power) {
    let strength = calcSat(power);
    let sat = (Math.pow(20.0, strength) - 1.0) / (20.0 - 1.0);
    let val = 1.0 - 0.05 * sat;

    return sprintf("#%06x", hsvToRgb(0.0, sat, val));
}

function calcSat(dbm) {
    return Math.min(Math.max((dbm + 127.0) / 54.0, 0.0), 1.0);
}

const Marker = ({loc, pos, active=false, preview=false, fadeIn=true}) => (
    h(Link, {
        mergePath: `/info/${loc.lkey}`,
        className: classNames("marker", {active, preview, fadeIn}),
        style: {
            background: calcBackground(loc.freqs[0].rxPower),
            left: pos.x,
            top: pos.y,
        },
    })
);

const ActiveMarker = observer(({proj}, {s}) => (
    s.curLoc ?
        h(Marker, {
            loc: s.curLoc,
            pos: calcPos(s.curLoc, proj),
            active: true,
            fadeIn: false,
        }) :
        h("span")
));

const PreviewMarker = observer(({proj}, {s}) => (
    s.previewLoc ?
        h(Marker, {
            loc: s.previewLoc,
            pos: calcPos(s.previewLoc, proj),
            preview: true,
        }) :
        h("span")
));

const Markers = observer(({proj}, {s}) => h("div", null,
    s.locs.map(loc =>
        h(Marker, {key: loc.lkey, loc, pos: calcPos(loc, proj)}))
));

const ProjMarkers = ({proj}) => h("div", null,
    proj ? [
        h(Markers, {proj}),
        h(ActiveMarker, {proj}),
        h(PreviewMarker, {proj}),
    ] : null
);

const AllMarkers = observer((_, {s}) => h(ProjMarkers, {proj: s.map.projection}));

const Overlay = (s, hist) => h(createContext({s, hist}), null, h(AllMarkers));

export default Overlay;
