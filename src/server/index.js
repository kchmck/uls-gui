import "babel-polyfill";

import InfernoServer from "inferno-server";
import createMemoryHistory from "history/createMemoryHistory";
import favicon from "koa-favicon";
import handlebars from "koa-handlebars";
import koa from "koa";
import mount from "koa-mount";
import route from "koa-route";
import serve from "koa-static";
import sqlite3 from "sqlite3";
import {ArgumentParser} from "argparse";

import App from  "../shared/components/app";
import {State} from "../shared/state";
import {createRoutes} from "../shared/routes";

function initServer() {
    let args = (function() {
        let parser = new ArgumentParser();

        parser.addArgument(["-d", "--db"], {
            required: true,
            help: "path to scrape-fcc sqlite database",
        });

        return parser.parseArgs();
    })();

    let db = new sqlite3.Database(args.db, sqlite3.OPEN_READONLY);
    let app = koa();

    app.use(handlebars());

    app.use(favicon("static/favicon.ico"));

    app.use(mount("/static", serve("static")));

    app.use(route.get("/api/records", createRecordFetcher(db)));

    app.use(function*() {
        let hist = createMemoryHistory();
        let state = new State(hist);
        let router = createRoutes(state);

        hist.push(this.request.url);
        router.handlePath(hist.location);

        let sidebar = InfernoServer.renderToString(App(state, hist));

        yield this.render("index", {state, sidebar});
    });

    app.listen(9428);
}

function createRecordFetcher(db) {
    const QUERY = `
        select records.rkey, callsign, title, eligibility,
               locations.lkey, latitude, longitude,
               frequencies.fkey, frequency, power,
               emission
        from records, recordDetails, frequencies, locations, emissions
        where recordDetails.rkey = records.rkey and
              locations.rkey = records.rkey and
              frequencies.rkey = records.rkey and
              frequencies.lkey = locations.lkey and
              emissions.rkey = records.rkey and
              emissions.fkey = frequencies.fkey
        order by records.rkey, locations.lkey, frequencies.fkey
    `;

    return function*() {
        this.body = yield new Promise((resolve, reject) => {
            let locs = [];

            let prevLoc = null;
            let prevFreq = null;
            let prevEmission = null;

            let loc = null;
            let freq = null;

            db.each(QUERY, (err, row) => {
                if (err) {
                    return reject(err);
                }

                let {rkey, lkey, fkey} = row;

                if (lkey !== prevLoc) {
                    prevLoc = lkey;
                    prevFreq = null;

                    let csIdx = row.title.indexOf(row.callsign);
                    let dashIdx = row.title.slice(csIdx).indexOf("-");

                    if (locs[lkey] && locs[lkey].rkey !== rkey) {
                        throw new Error("lkey clash");
                    }

                    loc = {
                        rkey: rkey,
                        lkey: lkey,
                        callsign: row.callsign,
                        desc: row.title.slice(csIdx + dashIdx + 2),
                        elig: row.eligibility || "",
                        lat: row.latitude,
                        lng: row.longitude,
                        freqs: [],
                    };

                    locs.push(loc);
                }

                if (fkey !== prevFreq) {
                    prevFreq = fkey;
                    prevEmission = null;

                    freq = {
                        fkey: fkey,
                        power: row.power,
                        freq: row.frequency,
                        emissions: [],
                    };

                    loc.freqs.push(freq);
                }

                if (row.emission !== prevEmission) {
                    prevEmission = row.emission;
                    freq.emissions.push(row.emission);
                }
            }, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve(locs);
                }
            });
        });
    };
}

if (process.env.NODE_ENV !== "test") {
    initServer();
}
