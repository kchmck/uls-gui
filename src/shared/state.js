import qs from "query-string";
import {observable, computed, action, autorun} from "mobx";

import {CENTER, CUTOFF_DIST} from "./consts";
import {VIS, createVisCalc} from "./visibility";

import {
    calcDist,
    calcRxPower,
    createPathLossCalc,
    milliWattToDbm,
} from "./util";

const calcPathLoss = createPathLossCalc(3.0);

export const createState = hist => observable({
    google: null,
    map: null,
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
    projection: null,
    docTitle: "",
    locCat: observable.map(),
    notes: observable.map(),
    editNotes: "",
    editingNotes: false,

    initMap: action(function(google, map, centerMarker) {
        Object.assign(this, {google, map, centerMarker});
    }),

    initLocs: action(function(locs) {
        let jitterLocs = locs.map(loc => Object.assign(loc, {
            jitterLat: (Math.random() - 0.5) * 10.0e-3,
            jitterLng: (Math.random() - 0.5) * 10.0e-3,
        }));

        let distLocs = computed(() => (
            jitterLocs.map(loc => Object.assign(loc, {
                dist: calcDist(CENTER, loc),
            })).filter(loc => loc.dist < CUTOFF_DIST)
        ));

        let freqLocs = computed(() => {
            let {freqLower, freqUpper, rxPowerLower} = this.filters;

            return distLocs.get().map(loc => Object.assign({}, loc, {
                freqs: loc.freqs.filter(f => (
                    f.freq > freqLower && f.freq < freqUpper
                )).map(f => Object.assign(f, {
                    rxPower: calcRxPower(milliWattToDbm(f.power),
                                         calcPathLoss(f.freq, loc.dist)),
                })).filter(f => (
                    f.rxPower > rxPowerLower
                )).sort((a, b) => (
                    b.rxPower - a.rxPower
                )),
            })).filter(loc => loc.freqs.length > 0);
        });

        let visLocs = computed(() => {
            let {vis} = this.filters;
            let calcVis = createVisCalc(this.locCat, this.notes);

            return freqLocs.get().map(loc => Object.assign(loc, {
                vis: calcVis(loc.lkey),
            })).filter(loc => (
                (loc.vis & vis) !== 0
            )).sort((a, b) => (
                b.freqs[0].rxPower - a.freqs[0].rxPower
            ));
        });

        autorun(() => {
            this.locs = visLocs.get();
        });
    }),

    selectLoc: action(function(lkey) {
        let idx = this.locs.findIndex(loc => loc.lkey === lkey);

        if (idx < 0) {
            throw new Error("location not visible");
        }

        this.curLoc = this.locs[idx];
    }),

    setTab: action(function(tab) {
        this.curTab = tab;
    }),

    setFilters: action(function(args) {
        let freqLower = parseFloat(args.freqLower);
        let freqUpper = parseFloat(args.freqUpper);
        let rxPowerLower = parseFloat(args.rxPowerLower);
        let vis = parseInt(args.vis, 10);

        Object.assign(this.filters, {
            freqLower: isNaN(freqLower) ? this.filters.freqLower : freqLower,
            freqUpper: isNaN(freqUpper) ? this.filters.freqUpper : freqUpper,
            rxPowerLower: isNaN(rxPowerLower) ? this.filters.rxPowerLower : rxPowerLower,
            vis: isNaN(vis) ? this.filters.vis : vis,
        });

        this.editFilters = Object.assign({}, this.filters);
    }),

    changeFilter: action(function(filter, value) {
        if (isNaN(value)) {
            return this;
        }

        this.editFilters[filter] = value;
    }),

    toggleFilterVis: action(function(visFlag) {
        this.editFilters.vis ^= visFlag;
    }),

    setProjection: action(function(projection) {
        this.projection = Object.create(projection);
    }),

    setCenter: action(function(loc) {
        if (this.map) {
            this.map.setCenter(loc);
        }
    }),

    setCurCenter: action(function() {
        this.setCenter(this.curLoc);
    }),

    setPreviewLoc: action(function(loc) {
        this.previewLoc = loc;
    }),

    resetPreviewLoc: action(function() {
        this.setPreviewLoc(null);
    }),

    setDocTitle: action(function(title) {
        this.docTitle = title;
    }),

    toggleCat: action(function(lkey, cat) {
        this.locCat.set(lkey, (this.locCat.get(lkey) & cat) ^ cat);
    }),

    startEditNotes: action(function(lkey) {
        this.editingNotes = true;
        this.editNotes = this.notes.get(lkey);
    }),

    changeNotes: action(function(notes) {
        this.editNotes = notes;
    }),

    discardNotes: action(function() {
        this.editingNotes = false;
    }),

    commitNotes: action(function(lkey) {
        this.notes.set(lkey, this.editNotes);
        this.editingNotes = false;
    }),

    loadState: action(function(state) {
        if (!state) {
            return;
        }

        this.locCat.merge(state.locCat || {});
        this.notes.merge(state.notes || {});
    }),

    commitFilters: action(function() {
        hist.push(Object.assign({}, hist.location, {
            search: `?${qs.stringify(this.editFilters)}`
        }));
    }),
});
