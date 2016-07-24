const initialState = {
    google: null,
    map: null,
    allLocs: null,
    centerMarker: null,
    curLoc: null,
    filters: {
        freqLower: 0,
        freqUpper: 5000.0e6,
        rxPowerLower: -121.0,
    },
    editFilters: {},
    locs: [],
    markers: [],
    overlay: null,
    curMarker: null,
    curTab: "info",
};

export default function(state = initialState, action) {
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
    case "initLocs": s.allLocs = action.locs; break;
    case "selectLoc": s.curLoc = s.locs[action.loc]; break;
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
    case "setLocs": s.locs = action.locs; break;
    case "setMarker": s.curMarker = action.marker; break;
    case "hideMarker":
        if (s.markers[s.curMarker]) {
            s.markers[s.curMarker].classList.remove("selected");
        }
    break;
    case "highlightMarker":
        if (s.markers[s.curMarker]) {
            s.markers[s.curMarker].classList.add("selected");
        }
    break;
    case "setOverlay": s.overlay = action.overlay; break;
    case "clearOverlay":
        if (s.overlay) {
            s.overlay.setMap(null);
        }
    break;
    case "setMarkers": s.markers = action.markers; break;
    case "setTab": s.curTab = action.tab; break;
    case "changeFilter":
        if (isNaN(action.value)) {
            break;
        }

        s.editFilters = {...s.editFilters,
            [action.filter]: action.value,
        };
    break;
    default: return state;
    }

    return s;
}
