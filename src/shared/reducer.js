const INIT_STATE = {
    google: null,
    map: null,
    allLocs: null,
    centerMarker: null,
    locs: [],
    curLoc: null,
    previewLoc: null,
    filters: {
        freqLower: 0,
        freqUpper: 5000.0e6,
        rxPowerLower: -121.0,
    },
    editFilters: {},
    curTab: "info",
    proj: null,
    docTitle: "",
};

export default function(state = INIT_STATE, action) {
    let s = Object.assign({}, state);

    /* eslint indent: "off" */
    switch (action.type) {
    case "initMap":
        Object.assign(s, {
            google: action.google,
            map: action.map,
            centerMarker: action.centerMarker,
        });
    break;
    case "initLocs":
        s.allLocs = action.locs;
    break;
    case "setLocs":
        s.locs = action.locs;
    break;
    case "selectLoc":
        s.curLoc = s.locs[action.idx];
    break;
    case "setTab":
        s.curTab = action.tab;
    break;
    case "setFilters": {
        let freqLower = parseFloat(action.freqLower);
        let freqUpper = parseFloat(action.freqUpper);
        let rxPowerLower = parseFloat(action.rxPowerLower);

        s.filters = {
            freqLower: isNaN(freqLower) ? s.filters.freqLower : freqLower,
            freqUpper: isNaN(freqUpper) ? s.filters.freqUpper : freqUpper,
            rxPowerLower: isNaN(rxPowerLower) ? s.filters.rxPowerLower : rxPowerLower,
        };

        s.editFilters = Object.assign({}, s.filters);
    } break;
    case "changeFilter":
        if (isNaN(action.value)) {
            break;
        }

        s.editFilters = {...s.editFilters,
            [action.filter]: action.value,
        };
    break;
    case "setProjection":
        s.proj = Object.create(action.proj);
    break;
    case "setCenter":
        s.map.setCenter(action.loc);
    break;
    case "setPreviewLoc":
        s.previewLoc = action.loc;
    break;
    case "resetPreviewLoc":
        s.previewLoc = null;
    break;
    case "setDocTitle":
        s.docTitle = action.title;
    break;
    default:
        return state;
    }

    return s;
}
