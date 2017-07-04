import createRouter from "@kchmck/simple-router";
import qs from "query-string";

export const createRoutes = state => {
    function withTitle(title, fn) {
        let titleFn = typeof title === "function" ? title : () => title;

        return function() {
            fn.apply(null, arguments);
            state.setDocTitle(titleFn.apply(null, arguments));
        };
    }

    return createRouter()
        .addCommon("/*", (_, loc) => {
            let {freqLower, freqUpper, rxPowerLower, vis} = qs.parse(loc.search);
            state.setFilters({freqLower, freqUpper, rxPowerLower, vis});
        })
        .addRoute("/", withTitle("Home", () => {}))
        .addRoute("/filters", withTitle("Filters", () => state.setTab("filters")))
        .addRoute("/list", withTitle("List", () => state.setTab("list")))
        .addCommon("/info/:param*", () => state.setTab("info"))
        .addRoute("/info/", () => {})
        .addRoute("/info/:id", withTitle(
            () => `${state.curLoc.callsign} - ${state.curLoc.desc}`,
            id => {
                let lkey = parseInt(id, 10);

                if (isNaN(lkey)) {
                    throw new Error("malformed location key");
                }

                state.selectLoc(lkey);
                state.resetPreviewLoc();
                state.discardNotes();
            }
        ))
        .addRoute("/search", withTitle("Search", () => state.setTab("search")));
};
