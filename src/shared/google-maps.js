const URL = "https://maps.googleapis.com/maps/api/js";
const CALLBACK_NAME = "__google_maps_callback__";

export function loadGoogleMaps({key, version}) {
    if (!key || !version) {
        throw new Error("API key and version required");
    }

    if (window[CALLBACK_NAME]) {
        throw new Error("global callback already defined");
    }

    let deferred = new Promise(resolve => {
        window[CALLBACK_NAME] = () => resolve(window.google);
    });

    let script = document.createElement("script");
    script.src = `${URL}?v=${version}&key=${key}&callback=${CALLBACK_NAME}`;
    document.body.appendChild(script);

    return deferred;
}

export function createOverlay(google, map, onClick, createMarkers) {
    let overlay = new google.maps.OverlayView();
    overlay.setMap(map);

    let layer = document.createElement("div");
    layer.addEventListener("click", e => onClick(e.target));

    function onAdd() {
        this.getPanes().overlayMouseTarget.appendChild(layer);
    }

    function onRemove() {
        layer.parentNode.removeChild(layer);
    }

    function draw() {
        let frag = document.createDocumentFragment();

        createMarkers(this.getProjection(), frag.appendChild.bind(frag));

        layer.innerHTML = "";
        layer.appendChild(frag);
    }

    return Object.assign(overlay, {
        onAdd,
        onRemove,
        draw,
    });
}
