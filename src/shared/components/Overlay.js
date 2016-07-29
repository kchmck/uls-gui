import React from "react";
import classNames from "classnames";
import {Link} from "@kchmck/redux-history-utils";
import {Provider, connect} from "react-redux";
import {sprintf} from "sprintf-js";

import {hsvToRgb} from "../util";

const Marker = ({loc, pos, active=false, preview=false}) => (
    <Link to={`/info/${loc.lkey}`}
        className={classNames("marker", {active, preview})}
        style={{
            background: calcBackground(loc.freqs[0].rxPower),
            left: pos.x,
            top: pos.y,
        }}
    />
);

const ActiveMarker = connect(({curLoc, proj}) => ({curLoc, proj}))(
    ({curLoc, proj}) => curLoc ?
        <Marker loc={curLoc} pos={calcPos(curLoc, proj)} active={true} /> :
        <span />
);

const PreviewMarker = connect(({previewLoc, proj}) => ({previewLoc, proj}))(
    ({previewLoc, proj}) => previewLoc ?
        <Marker loc={previewLoc} pos={calcPos(previewLoc, proj)} preview={true} /> :
        <span />
);

function calcBackground(power) {
    let strength = calcSat(power);
    let sat = (Math.pow(20.0, strength) - 1.0) / (20.0 - 1.0);
    let val = 1.0 - 0.05 * sat;

    return sprintf("#%06x", hsvToRgb(0.0, sat, val));
}

function calcSat(dbm) {
    return Math.min(Math.max((dbm + 127.0) / 54.0, 0.0), 1.0);
}

const Markers = connect(({locs, proj}) => ({locs, proj}))(
    ({locs, proj}) => <div>
        {locs.map(loc =>
            <Marker key={loc.lkey} loc={loc} pos={calcPos(loc, proj)} />)}
    </div>
);

function calcPos(loc, proj) {
    return proj.fromLatLngToDivPixel({
        lat: () => loc.lat + loc.jitterLat,
        lng: () => loc.lng + loc.jitterLng,
    });
}

const AllMarkers = () => <div>
    <Markers />
    <ActiveMarker />
    <PreviewMarker />
</div>;

const Overlay = props => <Provider {...props}>
    <AllMarkers />
</Provider>;

export default Overlay;
