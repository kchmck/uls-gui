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
    curMarker: null,
    prevSymbol: null,
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
    case "selectLoc": s.curLoc = action.loc; break;
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
    case "selectMarker": {
        let {nextMarker} = action;

        if (nextMarker == s.curMarker) {
            break;
        }

        if (s.curMarker != null) {
            s.curMarker.setIcon(s.prevSymbol);
        }

        s.curMarker = nextMarker;
        s.prevSymbol = Object.assign({}, nextMarker.getIcon());

        nextMarker.setIcon(Object.assign({}, s.prevSymbol, {
            strokeColor: "#A61600",
        }));
    } break;
    case "setMarkers": s.markers = action.markers; break;
    case "clearMarkers": {
        for (let marker of s.markers) {
            marker.setMap(null);
            s.google.maps.event.clearListeners(marker, "click");
        }
    } break;
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
