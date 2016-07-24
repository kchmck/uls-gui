import qs from "query-string";
import shallowEquals from "shallow-equals";
import {historyPush} from "@kchmck/redux-history-utils";
import {sprintf} from "sprintf-js";

import {CENTER, CUTOFF_DIST} from "./consts";
import {createOverlay} from "./google-maps";

import {
    calcDist,
    calcRxPower,
    createPathLossCalc,
    milliWattToDbm,
    calcSat,
    hsvToRgb,
} from "./util";

let calcPathLoss = createPathLossCalc(3.0);

export const initMap = (google, map, centerMarker) => ({
    type: "initMap", map, google, centerMarker,
});

export const initLocs = locs => ({type: "initLocs", locs});

export const setFilters = ({freqLower, freqUpper, rxPowerLower}) => {
    return withRecomputeMap({
        type: "setFilters", freqLower, freqUpper, rxPowerLower
    });
};

const withRecomputeMap = action => (dispatch, getState) => {
    let oldFilters = getState().filters;

    return dispatch(action).then(() => {
        if (!shallowEquals(getState().filters, oldFilters))
            return dispatch(recomputeMap());
    });
};

const recomputeMap = () => dispatch => Promise.all([
    dispatch(clearOverlay()),
    dispatch(recomputeLocs()),
]).then(() => dispatch(recomputeOverlay()));

export const recomputeLocs = () => (dispatch, getState) => dispatch({
    type: "setLocs",
    locs: computeLocs(getState()),
});

function computeLocs({allLocs, filters}) {
    let {freqLower, freqUpper, rxPowerLower} = filters;

    return allLocs
        .map(loc => Object.assign(loc, {
            dist: calcDist(CENTER, loc),
        }))
        .filter(loc => loc.dist < CUTOFF_DIST)
        .map(loc => Object.assign({}, loc, {
            freqs: loc.freqs
                .filter(f => f.freq > freqLower && f.freq < freqUpper)
                .map(f => Object.assign(f, {
                    rxPower: calcRxPower(milliWattToDbm(f.power),
                                         calcPathLoss(f.freq, loc.dist)),
                }))
                .filter(f => f.rxPower > rxPowerLower)
                .sort((a, b) => b.rxPower - a.rxPower),
        }))
        .filter(loc => loc.freqs.length > 0);
}

const clearOverlay = () => ({type: "clearOverlay"});

const recomputeOverlay = () => (dispatch, getState) => dispatch({
    type: "setOverlay",
    overlay: computeOverlay(dispatch, getState()),
});

function computeOverlay(dispatch, {google, map, locs}) {
    return createOverlay(google, map,
        el => {
            dispatch(historyPush(`/info/${el.dataset.lkey}`));
        },
        (proj, add) => dispatch(setMarkers(locs.map(loc => {
            let pos = proj.fromLatLngToDivPixel(new google.maps.LatLng({
                lat: loc.lat + loc.jitterLat,
                lng: loc.lng + loc.jitterLng,
            }));

            let marker = document.createElement("div");

            marker.dataset.lkey = loc.lkey;
            marker.className = "marker";
            marker.style.left = `${pos.x}px`;
            marker.style.top = `${pos.y}px`;

            let strength = calcSat(loc.freqs[0].rxPower);
            let sat = (Math.pow(20.0, strength) - 1.0) / (20.0 - 1.0);
            let val = 1.0 - 0.05 * sat;

            marker.style.background =
                sprintf("#%06x", hsvToRgb(0.0, sat, val));

            add(marker);

            return marker;
        })))
    );
}

export const setMarkers = markers => dispatch =>
    dispatch({type: "setMarkers", markers})
        .then(() => dispatch(highlightMarker()));

export const selectMarker = marker => dispatch =>
    dispatch(hideMarker())
        .then(() => dispatch(setMarker(marker)))
        .then(() => dispatch(highlightMarker()));

export const setMarker = marker => ({type: "setMarker", marker});
export const hideMarker = () => ({type: "hideMarker"});
export const highlightMarker = () => ({type: "highlightMarker"});

export const selectLoc = loc => ({type: "selectLoc", loc});

export const setTab = tab => ({type: "setTab", tab});

export const changeFilter = (filter, value) => ({
    type: "changeFilter", filter, value
});

export const commitFilters = () => (dispatch, getState) => {
    let {editFilters} = getState();
    return dispatch(historyPush({search: `?${qs.stringify(editFilters)}`}));
};
