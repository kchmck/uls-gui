import qs from "query-string";
import shallowEquals from "shallow-equals";
import {historyPush} from "@kchmck/redux-history-utils";
import {sprintf} from "sprintf-js";

import {CENTER, CUTOFF_DIST} from "../consts";

import {
    calcDist,
    calcRxPower,
    createPathLossCalc,
    milliWattToDbm,
    calcSat,
    hsvToRgb,
} from "../util";

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
    dispatch(clearMarkers()),
    dispatch(recomputeLocs()),
]).then(() => dispatch(recomputeMarkers()));

export const recomputeLocs = () => (dispatch, getState) => dispatch({
    type: "setLocs",
    locs: computeLocs(getState()),
});

const computeLocs = ({allLocs, filters}) => {
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
};

const clearMarkers = () => ({type: "clearMarkers"});

const recomputeMarkers = () => (dispatch, getState) => dispatch({
    type: "setMarkers",
    markers: computeMarkers(dispatch, getState()),
});

const computeMarkers = (dispatch, {google, map, locs}) => {
    const BASE_SYMBOL = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 5,
        strokeOpacity: 1.0,
        strokeColor: "#ffffff",
        strokeWeight: 1,
        fillOpacity: 1.0,
    };

    return locs.map(loc => {
        let strength = calcSat(loc.freqs[0].rxPower);
        let sat = (Math.pow(20.0, strength) - 1.0) / (20.0 - 1.0);
        let val = 1.0 - 0.05 * sat;

        let marker = new google.maps.Marker({
            map,
            position: loc,
            icon: Object.assign({}, BASE_SYMBOL, {
                fillColor: sprintf("#%06x", hsvToRgb(0.0, sat, val)),
            }),
        });

        marker.addListener("click", () => {
            dispatch(historyPush(`/info/${loc.lkey}`));
        });

        return marker;
    });
};

export const selectMarker = nextMarker => ({type: "selectMarker", nextMarker});

export const selectLoc = loc => ({type: "selectLoc", loc});

export const setTab = tab => ({type: "setTab", tab});

export const changeFilter = (filter, value) => ({
    type: "changeFilter", filter, value
});

export const commitFilters = () => (dispatch, getState) => {
    let {editFilters} = getState();

    return dispatch(historyPush({search: `?${qs.stringify(editFilters)}`}));
};
