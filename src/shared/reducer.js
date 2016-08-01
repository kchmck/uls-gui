import {VIS} from "./visibility";

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
        vis: VIS.DEFAULT,
    },
    editFilters: {},
    curTab: "info",
    proj: null,
    docTitle: "",
    locCat: {},
    notes: {},
    editNotes: "",
    editingNotes: false,
};


const HANDLERS = {
    initMap({google, map, centerMarker}) {
        return Object.assign(this, {google, map, centerMarker});
    },
    
    initLocs({locs}) {
        return Object.assign(this, {allLocs: locs});
    },
    
    setLocs({locs}) {
        return Object.assign(this, {locs});
    },
    
    selectLoc({idx}) {
        return Object.assign(this, {curLoc: this.locs[idx]});
    },
    
    setTab({tab}) {
        return Object.assign(this, {curTab: tab});
    },
    
    setFilters(args) {
        let freqLower = parseFloat(args.freqLower);
        let freqUpper = parseFloat(args.freqUpper);
        let rxPowerLower = parseFloat(args.rxPowerLower);
        let vis = parseInt(action.vis, 10);
        
        let filters = {
            freqLower: isNaN(freqLower) ? this.filters.freqLower : freqLower,
            freqUpper: isNaN(freqUpper) ? this.filters.freqUpper : freqUpper,
            rxPowerLower: isNaN(rxPowerLower) ? this.filters.rxPowerLower : rxPowerLower,
            vis: isNaN(vis) ? this.filters.vis : vis,
        };

        return Object.assign(this, {
            filters,
            editFilters: Object.assign({}, filters),
        });
    },
    
    changeFilter({filter, value}) {
        if (isNaN(value)) {
            return this;
        }

        return Object.assign(this, {
            editFilters: Object.assign({}, this.editFilters, {
                [filter]: value,
            }),
        });
    },
    
    toggleFilterVis({visFlag}) {
        return Object.assign(this, {
            editFilters: Object.assign({}, this.editFilters, {
                vis: this.editFilters.vis ^ visFlag,
            }),
        });
    },
    
    setProjection({proj}) {
        return Object.assign(this, {proj: Object.create(proj)});
    },
    
    setCenter({loc}) {
        this.map.setCenter(loc);
        return this;
    },
    
    setPreviewLoc({loc}) {
        return Object.assign(this, {previewLoc: loc});
    },
    
    // TODO: replace resetPreviewLoc with setPreviewLoc(null)
    
    setDocTitle({title}) {
        return Object.assign(this, {docTitle: title});
    },
    
    toggleCat({lkey, cat}) {
        return Object.assign(this, {
            locCat: Object.assign({}, this.locCat, {
                [lkey]: (this.locCat[lkey] & cat) ^ cat,
            }),
        });
    },
    
    startEditNotes({lkey}) {
        return Object.assign(this, {
            editingNotes: true,
            editNotes: s.notes[action.lkey],
        });
    },
    
    changeNotes({notes}) {
        return Object.assign(this, {editNotes: notes});
    },
    
    discardNotes() {
        return Object.assign(this, {editingNotes: false});
    },
    
    commitNotes({lkey}) {
        return Object.assign(this, {
            notes: Object.assign({}, this.notes, {
                [lkey]: this.editNotes,
            }),
            editingNotes: false,
        })
    },
    
    loadState({state}) {
        return state ? Object.assign(this, state) : this;
    }
};

export default function(state = INIT_STATE, action) {
    let {type, ...args} = action;
    let handler = HANDLERS[type];
    
    return handler ? handler.call(Object.assign({}, state), args)
                   : state;
}
