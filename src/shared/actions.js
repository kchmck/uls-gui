import qs from "query-string";
import shallowEquals from "shallow-equals";
import {historyPush} from "@kchmck/redux-history-utils";

import {CENTER, CUTOFF_DIST} from "./consts";

import {
    calcDist,
    calcRxPower,
    createPathLossCalc,
    milliWattToDbm,
} from "./util";

let calcPathLoss = createPathLossCalc(3.0);

export const initMap = (google, map, centerMarker) => ({
    type: "initMap", map, google, centerMarker,
});

export const initLocs = locs => ({type: "initLocs", locs});

export const setFilters = ({freqLower, freqUpper, rxPowerLower}) => {
    return withRecomputeLocs({
        type: "setFilters", freqLower, freqUpper, rxPowerLower
    });
};

const withRecomputeLocs = action => (dispatch, getState) => {
    let oldFilters = getState().filters;

    return dispatch(action).then(() => {
        if (!shallowEquals(getState().filters, oldFilters))
            return dispatch(recomputeLocs());
    });
};

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
        .filter(loc => loc.freqs.length > 0)
        .sort((a, b) => b.freqs[0].rxPower - a.freqs[0].rxPower);
}

export const selectLoc = lkey => (dispatch, getState) => {
    let idx = getState().locs.findIndex(loc => loc.lkey == lkey);

    if (idx < 0) {
        return Promise.reject("location not visible");
    }

    return dispatch({type: "selectLoc", idx});
};

export const setTab = tab => ({type: "setTab", tab});

export const changeFilter = (filter, value) => ({
    type: "changeFilter", filter, value
});

export const commitFilters = () => (dispatch, getState) => {
    let {editFilters} = getState();
    return dispatch(historyPush({search: `?${qs.stringify(editFilters)}`}));
};

export const setProjection = proj => ({type: "setProjection", proj});
