import qs from "query-string";
import {observable, computed, action, extendObservable} from "mobx";

import {CENTER, CUTOFF_DIST, SEARCH_OFFSET} from "./consts";
import {VIS, createVisCalc} from "./visibility";

import {
    calcDist,
    calcRxPower,
    createPathLossCalc,
    milliWattToDbm,
} from "./util";

const calcPathLoss = createPathLossCalc(3.0);

export function State(hist) {
    extendObservable(this, {
        google: null,
        map: null,
        centerMarker: null,

        rawLocs: [],
        jitterLocs: computed(() => {
            return this.rawLocs.map(loc => Object.assign(loc, {
                jitterLat: (Math.random() - 0.5) * 10.0e-3,
                jitterLng: (Math.random() - 0.5) * 10.0e-3,
            }));
        }),
        distLocs: computed(() => {
            return this.jitterLocs.map(loc => Object.assign(loc, {
                dist: calcDist(CENTER, loc),
            })).filter(loc => loc.dist < CUTOFF_DIST);
        }),
        freqLocs: computed(() => {
            let {freqLower, freqUpper, rxPowerLower} = this.filters;

            return this.distLocs.map(loc => Object.assign({}, loc, {
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
        }),
        locs: computed(() => {
            let {vis} = this.filters;
            let calcVis = createVisCalc(this.locCat, this.notes);

            return this.freqLocs.map(loc => Object.assign(loc, {
                vis: calcVis(loc.lkey),
            })).filter(loc => (
                (loc.vis & vis) !== 0
            )).sort((a, b) => (
                b.freqs[0].rxPower - a.freqs[0].rxPower
            ));
        }),

        curLoc: null,

        previewLoc: null,
        exitPreviewTimer: null,
        savedCenter: null,

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

        curError: null,

        search: new SearchFormState(),

        setError: action(err => {
            this.curError = err;
        }),

        initMap: action((google, map, centerMarker) => {
            Object.assign(this, {google, map, centerMarker});
        }),

        initLocs: action(locs => {
            this.rawLocs = locs;
        }),

        selectLoc: action(lkey => {
            let idx = this.locs.findIndex(loc => loc.lkey === lkey);

            if (idx < 0) {
                throw new Error("location not visible");
            }

            this.curLoc = this.locs[idx];
        }),

        setTab: action(tab => {
            this.curTab = tab;
        }),

        setFilters: action(args => {
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

        changeFilter: action((filter, value) => {
            if (isNaN(value)) {
                return this;
            }

            this.editFilters[filter] = value;
        }),

        toggleFilterVis: action(visFlag => {
            this.editFilters.vis ^= visFlag;
        }),

        setProjection: action(projection => {
            this.projection = Object.create(projection);
        }),

        setCenter: action(loc => {
            if (this.map) {
                this.map.setCenter(loc);
            }
        }),

        setCurCenter: action(() => {
            this.saveCenter();
            this.setCenter(this.curLoc);
        }),

        setPreviewLoc: action(loc => {
            this.previewLoc = loc;
        }),

        resetPreviewLoc: action(() => {
            this.setPreviewLoc(null);
        }),

        setDocTitle: action(title => {
            this.docTitle = title;
        }),

        toggleCat: action((lkey, cat) => {
            this.locCat.set(lkey, (this.locCat.get(lkey) & cat) ^ cat);
        }),

        startEditNotes: action(lkey => {
            this.editingNotes = true;
            this.editNotes = this.notes.get(lkey);
        }),

        changeNotes: action(notes => {
            this.editNotes = notes;
        }),

        discardNotes: action(() => {
            this.editingNotes = false;
        }),

        commitNotes: action(lkey => {
            this.notes.set(lkey, this.editNotes);
            this.editingNotes = false;
        }),

        loadState: action(state => {
            if (!state) {
                return;
            }

            this.locCat.merge(state.locCat || {});
            this.notes.merge(state.notes || {});
        }),

        commitFilters: action(() => {
            hist.push(Object.assign({}, hist.location, {
                search: `?${qs.stringify(this.editFilters)}`
            }));
        }),

        searchLocs: computed(() => {
            if (isNaN(this.search.committedFreq)) {
                return [];
            }

            let center = this.search.committedFreq * 1.0e6;
            let lower = center - SEARCH_OFFSET;
            let upper = center + SEARCH_OFFSET;

            return this.locs.map(loc => Object.assign({}, loc, {
                freqs: loc.freqs.filter(f => f.freq >= lower && f.freq <= upper)
            })).filter(loc => loc.freqs.length > 0);
        }),

        enterPreview: action(loc => {
            // Only save center when initially entering preview.
            if (this.exitPreviewTimer === null) {
                this.saveCenter();
            }

            clearTimeout(this.exitPreviewTimer);
            this.exitPreviewTimer = null;

            this.setCenter(loc);
            this.setPreviewLoc(loc);
        }),

        exitPreview: action(delay => {
            this.exitPreviewTimer = setTimeout(() => {
                this.restoreCenter();
                this.resetPreviewLoc();
            }, delay);
        }),

        saveCenter: action(() => {
            this.savedCenter = this.map.getCenter();
        }),

        restoreCenter: action(() => {
            this.map.setCenter(this.savedCenter);
        }),
    });
}

function SearchFormState() {
    extendObservable(this, {
        changeFreq: action(search => {
            this.editFreq = search;
        }),
        commitFreq: action(() => {
            this.committedFreq = this.parsedFreq;
        }),
        editFreq: "150.0",
        parsedFreq: computed(() => {
            return Number(this.editFreq);
        }),
        freqInvalid: computed(() => {
            return Number.isNaN(this.parsedFreq);
        }),
        committedFreq: NaN,
    });
}
