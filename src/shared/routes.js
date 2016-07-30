import createRouter from "@kchmck/simple-router";
import qs from "query-string";

import {
    setFilters,
    selectLoc,
    setTab,
    setDocTitle,
} from "./actions";

export default ({dispatch, getState}) => {
    function withTitle(title, fn) {
        let titleFn = typeof title === "function" ? title : () => title;

        return (...args) => fn(...args).then(() =>
            dispatch(setDocTitle(titleFn(...args))));
    }

    return createRouter()
        .addCommon("/*", (_, loc) => {
            let {freqLower, freqUpper, rxPowerLower} = qs.parse(loc.search);
            return dispatch(setFilters({freqLower, freqUpper, rxPowerLower}));
        })
        .addRoute("/", withTitle("Home", () => Promise.resolve()))
        .addRoute("/filters", withTitle("Filters", () => dispatch(setTab("filters"))))
        .addRoute("/list", withTitle("List", () => dispatch(setTab("list"))))
        .addCommon("/info/:param*", () => dispatch(setTab("info")))
        .addRoute("/info/", () => Promise.resolve())
        .addRoute("/info/:id", withTitle(
            () => `${getState().curLoc.callsign} - ${getState().curLoc.desc}`,
            id => {
                let lkey = parseInt(id, 10);

                if (isNaN(lkey)) {
                    return Promise.reject("malformed location key");
                }

                return dispatch(selectLoc(lkey));
            }
        ));
};
