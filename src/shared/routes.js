import createRouter from "@kchmck/simple-router";
import qs from "query-string";

import {
    setFilters,
    selectLoc,
    setTab,
} from "./actions";

export default ({dispatch}) => {
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
            let lkey = parseInt(id);

            if (isNaN(lkey)) {
                return Promise.reject("malformed location key");
            }

            return dispatch(selectLoc(lkey));
        });
};
