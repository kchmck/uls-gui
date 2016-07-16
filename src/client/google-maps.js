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
