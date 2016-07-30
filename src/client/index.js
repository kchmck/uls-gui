import "babel-polyfill";

import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import {createHistory} from "history";

import App from "../shared/components/App";
import Overlay from "../shared/components/Overlay";
import createRoutes from "../shared/routes";
import createStore from "../shared/store";
import reducer from "../shared/reducer";
import {CENTER, DEFAULT_ZOOM} from "../shared/consts";
import {loadGoogleMaps} from "../shared/google-maps";
import {subscribeState} from "../shared/util";

import {
    initMap,
    initLocs,
    setProjection,
    recomputeLocs,
    setState,
} from "../shared/actions";

let hist = createHistory();
let store = createStore(hist)(reducer);
let router = createRoutes(store);

Promise.all([
    loadGoogleMaps({
        key: process.env.MAPS_API_KEY,
        version: "3.25",
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
                ReactDOM.render(<Overlay store={store} />,
                    this.getPanes().overlayMouseTarget);
            },
            draw() {
                store.dispatch(setProjection(this.getProjection()));
            },
        });

        overlay.setMap(map);

        subscribeState(store, ({docTitle}) => docTitle, docTitle => {
            document.title = docTitle;
        });

        return store.dispatch(initMap(google, map, new google.maps.Marker({
            map,
            position: CENTER,
        })));
    }),
    axios.get("/api/records").then(({data}) => store.dispatch(initLocs(
        data.map(loc => Object.assign(loc, {
            jitterLat: (Math.random() - 0.5) * 10.0e-3,
            jitterLng: (Math.random() - 0.5) * 10.0e-3,
        }))
    ))),
    store.dispatch(setState(JSON.parse(localStorage.getItem("state")))).then(() => {
        subscribeState(store,
            ({ignored, confirmed, notes}) => ({ignored, confirmed, notes}),
            state => localStorage.setItem("state", JSON.stringify(state))
        );
    }),
]).then(() => {
    return store.dispatch(recomputeLocs());
}).then(() => {
    return router.handlePath(hist.getCurrentLocation());
}).then(() => {
    hist.listen(router.handlePath);
    ReactDOM.render(<App store={store} />, document.getElementById("sidebar"));
});
