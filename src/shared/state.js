import qs from "query-string";
import {autorun, observable, computed, action, extendObservable} from "mobx";

import * as error from "./error";
import {CUTOFF_DIST, SEARCH_OFFSET} from "./consts";
import {VIS, createVisCalc} from "./visibility";

import {
    calcDist,
    calcRxPower,
    createPathLossCalc,
    milliWattToDbm,
} from "./util";

const calcPathLoss = createPathLossCalc(3.0);

export function State(hist) {
    let map = new MapState();

    extendObservable(this, {
        map,

        rawLocs: observable.ref([]),
        jitterLocs: observable.ref([]),
        distLocs: observable.ref([]),
        freqLocs: observable.ref([]),
        locs: observable.ref([]),

        curLoc: null,

        previewLoc: null,
        exitPreviewTimer: null,

        filters: {
            freqLower: 0,
            freqUpper: 5000.0e6,
            rxPower: -121.0,
            vis: VIS.DEFAULT,
        },
        editFilters: {},
        locCat: observable.map(),

        curTab: "info",
        docTitle: null,

        curError: null,

        search: new SearchFormState(),

        setError: action(err => {
            this.curError = err;
        }),

        setLocs: action(locs => {
            this.rawLocs = locs;
        }),

        selectLoc: action(lkey => {
            let idx = this.locs.findIndex(loc => loc.lkey === lkey);

            if (idx < 0) {
                return this.setError(error.UnknownLocError);
            }

            this.curLoc = this.locs[idx];
            this.setDocTitle(`${this.curLoc.callsign} - ${this.curLoc.desc}`);
        }),

        setTab: action(tab => {
            this.curTab = tab;
        }),

        setFilters: action(args => {
            let freqLower = parseFloat(args.freqLower);
            let freqUpper = parseFloat(args.freqUpper);
            let rxPower = parseFloat(args.rxPower);
            let vis = parseInt(args.vis, 10);

            Object.assign(this.filters, {
                freqLower: isNaN(freqLower) ? this.filters.freqLower : freqLower,
                freqUpper: isNaN(freqUpper) ? this.filters.freqUpper : freqUpper,
                rxPower: isNaN(rxPower) ? this.filters.rxPower : rxPower,
                vis: isNaN(vis) ? this.filters.vis : vis,
            });

            this.editFilters = Object.assign({}, this.filters);
        }),

        changeFilter: action((filter, value) => {
            if (isNaN(value)) {
                return;
            }

            this.editFilters[filter] = value;
        }),

        toggleFilterVis: action(visFlag => {
            this.editFilters.vis ^= visFlag;
        }),

        setCurCenter: action(() => {
            this.map.saveCenter();
            this.map.setCenter(this.curLoc);
        }),

        setPreviewLoc: action(loc => {
            this.previewLoc = loc;
        }),

        resetPreviewLoc: action(() => {
            this.setPreviewLoc(null);
        }),

        setDocTitle: action(title => {
            this.docTitle = `ULS Map | ${title}`;
        }),

        toggleCat: action((lkey, cat) => {
            this.locCat.set(lkey, (this.locCat.get(lkey) & cat) ^ cat);
        }),

        loadState: action(state => {
            if (!state) {
                return;
            }

            this.locCat.merge(state.locCat || {});

            if (state.basePos) {
                this.map.basePos = state.basePos;
            }
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
                this.map.saveCenter();
            }

            clearTimeout(this.exitPreviewTimer);
            this.exitPreviewTimer = null;

            this.map.setCenter(loc);
            this.setPreviewLoc(loc);
        }),

        exitPreview: action(delay => {
            this.exitPreviewTimer = setTimeout(() => {
                this.map.restoreCenter();
                this.resetPreviewLoc();
            }, delay);
        }),
    });

    autorun(() => {
        this.jitterLocs = this.rawLocs.map(loc => Object.assign(loc, {
            jitterLat: (Math.random() - 0.5) * 10.0e-3,
            jitterLng: (Math.random() - 0.5) * 10.0e-3,
        }));
    });

    autorun(() => {
        this.distLocs = this.jitterLocs.map(loc => Object.assign(loc, {
            dist: calcDist(map.basePos, loc),
        })).filter(loc => loc.dist < CUTOFF_DIST);
    });

    autorun(() => {
        let {freqLower, freqUpper, rxPower} = this.filters;

        this.freqLocs = this.distLocs.map(loc => Object.assign({}, loc, {
            freqs: loc.freqs.filter(f => (
                f.freq > freqLower && f.freq < freqUpper
            )).map(f => Object.assign(f, {
                rxPower: calcRxPower(milliWattToDbm(f.power),
                                     calcPathLoss(f.freq, loc.dist)),
            })).filter(f => (
                f.rxPower > rxPower
            )).sort((a, b) => (
                b.rxPower - a.rxPower
            )),
        })).filter(loc => loc.freqs.length > 0);
    });

    autorun(() => {
        let {vis} = this.filters;
        let calcVis = createVisCalc(this.locCat);

        this.locs = this.freqLocs.map(loc => Object.assign(loc, {
            vis: calcVis(loc.lkey),
        })).filter(loc => (
            (loc.vis & vis) !== 0
        )).sort((a, b) => (
            b.freqs[0].rxPower - a.freqs[0].rxPower
        ));
    });

    this.setDocTitle("Initializing...");
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

function MapState() {
    extendObservable(this, {
        google: null,
        map: null,
        basePos: observable.ref(null),
        projection: null,
        baseMarker: null,
        savedCenter: null,

        init: action((google, map) => {
            if (this.google !== null) {
                return this.setError(error.MapInitError);
            }

            let baseMarker = new google.maps.Marker({
                map,
                position: this.basePos,
                draggable: true,
            });

            baseMarker.addListener("dragend", () => {
                let pos = this.baseMarker.getPosition();

                this.setBasePos({
                    lat: pos.lat(),
                    lng: pos.lng(),
                });
            });

            Object.assign(this, {google, map, baseMarker});
        }),

        setBasePos: action(basePos => {
            this.basePos = basePos;
        }),

        setProjection: action(projection => {
            this.projection = Object.create(projection);
        }),

        setCenter: action(loc => {
            if (this.map) {
                this.map.setCenter(loc);
            }
        }),

        saveCenter: action(() => {
            this.savedCenter = this.map.getCenter();
        }),

        restoreCenter: action(() => {
            this.map.setCenter(this.savedCenter);
        }),
    });
}
