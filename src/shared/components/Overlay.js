import React from "react";
import classNames from "classnames";
import {Link} from "@kchmck/redux-history-utils";
import {Provider} from "react-redux";
import {connect} from "react-redux";
import {sprintf} from "sprintf-js";

import {hsvToRgb} from "../util";

const Marker = ({loc, pos, active}) => (
    <Link to={`/info/${loc.lkey}`}
        className={classNames("marker", {active})}
        style={{
            background: calcBackground(loc.freqs[0].rxPower),
            left: pos.x,
            top: pos.y,
        }}
    />
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

const Markers = connect(({locs, proj, curLoc}) => ({locs, proj, curLoc}))(
    ({locs, proj, curLoc}) => <div>
        {locs.map(loc =>
            <Marker key={loc.lkey} loc={loc} pos={calcPos(loc, proj)}
                active={curLoc && curLoc.lkey == loc.lkey} />)}
    </div>
);

function calcPos(loc, proj) {
    return proj.fromLatLngToDivPixel({
        lat: () => loc.lat + loc.jitterLat,
        lng: () => loc.lng + loc.jitterLng,
    });
}

const Overlay = props => <Provider {...props}>
    <Markers />
</Provider>;

export default Overlay;
