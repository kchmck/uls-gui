import createRouter from "@kchmck/simple-router";
import qs from "query-string";

import {
    setFilters,
    selectMarker,
    selectLoc,
    setTab,
} from "./actions";

export default ({dispatch, getState}) => {
    return createRouter()
        .addCommon("/*", (_, loc) => {
            let {freqLower, freqUpper, rxPowerLower} = qs.parse(loc.search);
            return dispatch(setFilters({freqLower, freqUpper, rxPowerLower}));
        })
        .addRoute("/", () => Promise.resolve())
        .addRoute("/filters", () => dispatch(setTab("filters")))
        .addRoute("/list", () => dispatch(setTab("list")))
        .addCommon("/info/:param*", () => dispatch(setTab("info")))
        .addRoute("/info/", () => Promise.resolve())
        .addRoute("/info/:id", id => {
            id = parseInt(id);

            if (isNaN(id)) {
                return Promise.resolve();
            }

            let {locs, markers} = getState();
            let idx = locs.findIndex(loc => loc.lkey == id);

            if (idx < 0) {
                return Promise.resolve();
            }

            return Promise.all([
                dispatch(selectMarker(markers[idx])),
                dispatch(selectLoc(locs[idx])),
            ]);
        });
};
