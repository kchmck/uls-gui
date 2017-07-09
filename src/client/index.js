import "babel-polyfill";

import Inferno from "inferno";
import axios from "axios";
import createHistory from "history/createBrowserHistory";
import {autorun} from "mobx";

import App from "../shared/components/app";
import Overlay from "../shared/components/overlay";
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

            router.handlePath(hist.location);
            hist.listen(router.handlePath);
        }),
    ]);
}

if (process.env.NODE_ENV !== "test") {
    initClient();
}
