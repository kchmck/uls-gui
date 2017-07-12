import "babel-polyfill";

import Inferno from "inferno";
import axios from "axios";
import createHistory from "history/createBrowserHistory";
import {autorun} from "mobx";

import App from "../shared/components/app";
import Overlay from "../shared/components/overlay";
import {CENTER, DEFAULT_ZOOM} from "../shared/consts";
import {createRoutes} from "../shared/routes";
import {State} from "../shared/state";
import {loadGoogleMaps} from "../shared/google-maps";

function initClient() {
    let hist = createHistory();
    let state = new State(hist);
    let router = createRoutes(state);

    state.loadState(JSON.parse(localStorage.getItem("state")));

    autorun(function() {
        let {locCat} = state;
        let {basePos} = state.map;

        localStorage.setItem("state", JSON.stringify({locCat, basePos}));
    });

    if (state.map.basePos === null) {
        state.map.setBasePos(CENTER);
    }

    autorun(function() {
        document.title = state.docTitle;
    });

    Inferno.render(App(state, hist), document.getElementById("sidebar"));

    Promise.all([
        loadGoogleMaps({
            key: process.env.MAPS_API_KEY,
            version: "3.29",
        }).then(google => {
            let map = new google.maps.Map(document.getElementById("map"), {
                center: state.map.basePos,
                zoom: DEFAULT_ZOOM,
                draggableCursor: "default",
                disableDoubleClickZoom: true,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{visibility: "off"}]
                    },
                    {
                        featureType: "transit",
                        elementType: "labels",
                        stylers: [{visibility: "off"}]
                    }
                ]
            });

            let overlay = Object.assign(new google.maps.OverlayView(), {
                onAdd() {
                    Inferno.render(Overlay(state, hist),
                        this.getPanes().overlayMouseTarget);
                },
                draw() {
                    state.map.setProjection(this.getProjection());
                },
            });

            overlay.setMap(map);

            state.map.init(google, map);
        }),
        axios.get("/api/records").then(({data}) => {
            state.setLocs(data);

            router.handlePath(hist.location);
            hist.listen(router.handlePath);
        }),
    ]);
}

if (process.env.NODE_ENV !== "test") {
    initClient();
}
