import qs from "query-string";
import shallowEquals from "shallow-equals";
import {historyPush} from "@kchmck/redux-history-utils";

import {CENTER, CUTOFF_DIST} from "./consts";
import {createVisCalc} from "./visibility";

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

export const setFilters = ({...filts}) => {
    return withRecomputeLocs({type: "setFilters", ...filts});
};

const withRecomputeLocs = action => (dispatch, getState) => {
    let oldFilters = getState().filters;

    return dispatch(action).then(() => {
        if (!shallowEquals(getState().filters, oldFilters)) {
            return dispatch(recomputeLocs());
        } else {
            return Promise.resolve();
        }
    });
};

export const recomputeLocs = () => (dispatch, getState) => {
    let state = getState();
    let calcVis = createVisCalc(state);

    return dispatch({
        type: "setLocs",
        locs: computeLocs(state, calcVis),
    });
};

function computeLocs({allLocs, filters}, calcVis) {
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
        .map(loc => Object.assign(loc, {
            vis: calcVis(loc.lkey),
        }))
        .filter(loc => (loc.vis & filters.vis) !== 0)
        .sort((a, b) => b.freqs[0].rxPower - a.freqs[0].rxPower);
}

export const selectLoc = lkey => (dispatch, getState) => {
    let idx = getState().locs.findIndex(loc => loc.lkey === lkey);

    if (idx < 0) {
        return Promise.reject("location not visible");
    }

    return dispatch({type: "selectLoc", idx});
};

export const setPreviewLoc = loc => ({type: "setPreviewLoc", loc});

export const resetPreviewLoc = () => ({type: "resetPreviewLoc"});

export const setTab = tab => ({type: "setTab", tab});

export const changeFilter = (filter, value) => ({
    type: "changeFilter", filter, value
});

export const commitFilters = () => (dispatch, getState) => {
    let {editFilters} = getState();
    return dispatch(historyPush({search: `?${qs.stringify(editFilters)}`}));
};

export const setProjection = proj => ({type: "setProjection", proj});

export const setCenter = loc => ({type: "setCenter", loc});

export const setCurCenter = () => (dispatch, getState) =>
    dispatch(setCenter(getState().curLoc));

export const setDocTitle = title => ({type: "setDocTitle", title});

export const toggleCat = (lkey, cat) => dispatch =>
    dispatch({type: "toggleCat", lkey, cat})
        .then(() => dispatch(recomputeLocs()));

export const startEditNotes = lkey => ({type: "startEditNotes", lkey});

export const changeNotes = notes => ({type: "changeNotes", notes});

export const discardNotes = () => ({type: "discardNotes"});

export const commitNotes = lkey => ({type: "commitNotes", lkey});

export const toggleFilterVis = visFlag => ({type: "toggleFilterVis", visFlag});

export const loadState = state => ({type: "loadState", state});
