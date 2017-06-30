import "babel-polyfill";

import Inferno from "inferno";
import axios from "axios";
import {autorun} from "mobx";
import {createHistory} from "history";

import App from "../shared/components/App";
import Overlay from "../shared/components/Overlay";
import {CENTER, DEFAULT_ZOOM} from "../shared/consts";
import {createRoutes} from "../shared/routes";
import {createState} from "../shared/state";
import {loadGoogleMaps} from "../shared/google-maps";

function initClient() {
    let hist = createHistory();
    let state = createState(hist);
    let router = createRoutes(state);

    state.loadState(JSON.parse(localStorage.getItem("state")));

    autorun(function() {
        let {locCat, notes} = state;
        localStorage.setItem("state", JSON.stringify({locCat, notes}));
    });

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
                center: CENTER,
                zoom: DEFAULT_ZOOM,
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
                    state.setProjection(this.getProjection());
                },
            });

            overlay.setMap(map);

            state.initMap(google, map, new google.maps.Marker({
                map,
                position: CENTER,
            }));
        }),
        axios.get("/api/records").then(({data}) => {
            state.initLocs(data);

            router.handlePath(hist.getCurrentLocation());
            hist.listen(router.handlePath);
        }),
    ]);
}

if (process.env.NODE_ENV !== "test") {
    initClient();
}
