import classNames from "classnames";
import h from "inferno-hyperscript";
import marked from "marked";
import {observer} from "inferno-mobx";

import {Link} from "./link";
import {VIS} from "../visibility";
import {createContext} from "./context";
import {locUrl, freqUrl} from "../urls";

import {
    calcSReading,
    parseEmission,
} from "../util";

const onEvent = fn => e => {
    e.preventDefault();
    return fn(e);
};

const onFilterChange = (id, fn, proc) =>
    onEvent(e => fn(id, proc(parseFloat(e.target.value))));

const procFreq = freq => freq * 1.0e6;
const dispFreq = freq => freq / 1.0e6;

const defaultDisp = x => x;
const defaultProc = x => x;

const Icon = ({name}) => h("span", {className: `fa fa-${name}`});

const ControlButton = ({active, ...props}) => h("button", Object.assign(props, {
    type: "button",
    className: classNames("btn btn-secondary", {active}),
}));

const CatButton = observer(({lkey, cat, title, children}, {s}) => h(ControlButton, {
    title,
    active: s.locCat.get(lkey) === cat,
    onClick: () => s.toggleCat(lkey, cat),
}, children));

const LocControls = ({lkey}, {s}) => h("div#controls", null,
    h("div.btn-group.btn-group-sm", null, [
        h(ControlButton, {
            onClick: () => s.setCurCenter(),
            title: "Center",
            onMouseEnter: () => s.enterPreview(s.curLoc),
            onMouseLeave: () => s.exitPreview(0),
        }, h(Icon, {name: "crosshairs"})),
        h(CatButton, {lkey, cat: VIS.IGNORED, title: "Ignore"},
            h(Icon, {name: "ban"})),
        h(CatButton, {lkey, cat: VIS.REVIEWING, title: "Review"},
            h(Icon, {name: "eye"})),
        h(CatButton, {lkey, cat: VIS.CONFIRMED, title: "Confirm"},
            h(Icon, {name: "check"})),
    ])
);

const NotesText = ({notes}) => h("div", {
    dangerouslySetInnerHTML: {__html: marked(notes)}
});

const NoNotes = () => h("p", null, h("em", null, "No notes recorded"));

const MaybeShowNotes = ({notes}) => h("div#noteText", null,
    notes ? h(NotesText, {notes}) : h(NoNotes));

const EditNotes = observer(({lkey}, {s}) => h("div", null, [
    h("fieldset.form-group", null, [
        h("label.sr-only", {htmlFor: "editNotes"}, "Enter location notes"),
        h("textarea#editNotes.form-control", {
            rows: 3,
            value: s.editNotes,
            autoFocus: true,
            onChange: e => s.changeNotes(e.target.value),
        }),
    ]),
    h("fieldset.btn-group.btn-group-sm", null, [
        h("button.btn.btn-primary", {onClick: () => s.commitNotes(lkey)},
            [h(Icon, {name: "floppy-o"}), " Save"]),
        h("button.btn.btn-secondary", {onClick: () => s.discardNotes()}, "Cancel")
    ]),
]));

const ShowNotes = observer(({lkey}, {s}) => h("div", null, [
    h(MaybeShowNotes, {notes: s.notes.get(lkey)}),
    h("fieldset.form-group", null, h("button.btn.btn-secondary.btn-sm", {
        onClick: () => s.startEditNotes(lkey),
    }, [h("span.fa.fa-pencil"), " Edit"]))
]));

const Notes = observer(({lkey}, {s}) => h("div#notes", null,
    s.editingNotes ? h(EditNotes, {lkey}) : h(ShowNotes, {lkey})));

const LocHeading = ({rkey, lkey, callsign, desc, elig}) => h("div", null, [
    h("h1.callsign", null, h("a", {href: locUrl(rkey, lkey)}, callsign)),
    h("p.desc", null, desc),
    h(LocControls, {lkey}),
    h("h2", null, "Eligibility"),
    h(MaybeElig, {elig}),
    h("h2", null, "Notes"),
    h(Notes, {lkey}),
]);

const MaybeElig = ({elig}) => h("p", null,
    elig || h("em", null, "No eligibility given"));

const Heading = ({loc}) => h(LocHeading, loc);

const Emission = ({raw, em}) => h("li", {title: raw},
    `${em.bandwidth / 1.0e3}kHz, ${em.modulation}, ${em.signal}, ${em.info}`);

const Freq = ({rkey, fkey, freq, power, rxPower, emissions}) => (
    h("div.freq", null, [
        h("div.row", null, [
            h("h2.col-10", null, h("a", {
                href: freqUrl(rkey, fkey),
                title: `${freq} Hz`,
            }, `${dispFreq(freq)} MHz`)),
            h("div.sReading.col-2", {title: `${power / 1.0e3}W`},
                calcSReading(rxPower)),
        ]),
        h("ul", null, emissions.map(raw =>
            h(Emission, {raw, em: parseEmission(raw)}))),
    ])
);

const Freqs = ({loc}) => h("div", null,
    loc.freqs.map(info => h(Freq, Object.assign({rkey: loc.rkey}, info))));

const Info = ({loc}) => h("div", null, [
    h(Heading, {loc}),
    h(Freqs, {loc}),
]);

const NoInfo = () => h("p", null, h("em", null, "No location selected"));

const MaybeInfo = observer((_, {s}) => h("div#info.pane", null,
    s.curLoc ? h(Info, {loc: s.curLoc}) : h(NoInfo)));

const FilterInput = observer(({id, disp=defaultDisp, proc=defaultProc}, {s}) => (
    h("input.form-control", {
        id,
        type: "text",
        value: disp(s.editFilters[id]),
        onChange: onFilterChange(id, s.changeFilter.bind(s), proc),
    })
));

const FilterVisibility = observer(({visFlag, title, children}, {s}) => (
    h("button", {
        type: "button",
        className: classNames("btn btn-secondary", {
            active: (s.editFilters.vis & visFlag) !== 0,
        }),
        onClick: onEvent(() => s.toggleFilterVis(visFlag)),
        title,
    }, children)
));

const Filters = (_, {s}) => (
    h("form", {onSubmit: onEvent(() => s.commitFilters())}, [
        h("fieldset.form-group", null, [
            h("label", {htmlFor: "freqLower"}, "Lower frequency"),
            h("div.input-group", null, [
                h(FilterInput, {id: "freqLower", disp: dispFreq, proc: procFreq}),
                h("div.input-group-addon", null, "MHz"),
            ])
        ]),
        h("fieldset.form-group", null, [
            h("label", {htmlFor: "freqUpper"}, "Upper frequency"),
            h("div.input-group", null, [
                h(FilterInput, {id: "freqUpper", disp: dispFreq, proc: procFreq}),
                h("div.input-group-addon", null, "MHz"),
            ])
        ]),
        h("fieldset.form-group", null, [
            h("label", {htmlFor: "rxPowerLower"}, "Receive power"),
            h("div.input-group", null, [
                h(FilterInput, {id: "rxPowerLower"}),
                h("div.input-group-addon", null, "dBm"),
            ])
        ]),
        h("fieldset.form-group#visibility", null, [
            h("label", {htmlFor: "visibility"}, "Visibility"),
            h("div.btn-group.btn-block", null, [
                h(FilterVisibility, {visFlag: VIS.UNCONFIRMED, title: "Unconfirmed"},
                    h(Icon, {name: "question"})),
                h(FilterVisibility, {visFlag: VIS.IGNORED, title: "Ignored"},
                    h(Icon, {name: "ban"})),
                h(FilterVisibility, {visFlag: VIS.REVIEWING, title: "Reviewing"},
                    h(Icon, {name: "eye"})),
                h(FilterVisibility, {visFlag: VIS.CONFIRMED, title: "Confirmed"},
                    h(Icon, {name: "check"})),
                h(FilterVisibility, {visFlag: VIS.ANNOTATED, title: "Annotated"},
                    h(Icon, {name: "pencil"})),
            ]),
        ]),
        h("button.btn.btn-primary", {type: "submit"}, "Filter"),
    ])
);

const SearchPane = (_, {s}) => h("div#search.pane", null, [
    h(SearchForm, {search: s.search}),
    h(SearchList),
]);

const SearchForm = ({search}, {s}) => (
    h("form", {onSubmit: onEvent(() => s.search.commitFreq())}, [
        h(SearchInput, {search}),
        h(SearchSubmit, {search}),
    ])
);

const SearchInput = observer(({search}) => (
    h("fieldset", {
        className: classNames("form-group", {
            "has-danger": search.freqInvalid,
        }),
    }, [
        h("label.form-control-label", {htmlFor: "searchFreq"}, "Search frequency"),
        h("div.input-group", null, [
            h("input.form-control", {
                id: "searchFreq",
                type: "text",
                value: search.editFreq,
                onInput: onEvent(e => search.changeFreq(e.target.value)),
            }),
            h("div.input-group-addon", null, "MHz"),
        ]),
    ])
));

const SearchSubmit = observer(({search}) => (
    h("fieldset.form-group", null, h("button.btn.btn-primary", {
        type: "submit",
        disabled: search.freqInvalid,
    }, "Search (±10kHz)"))
));

const SearchList = observer((_, {s}) => h(MaybeList, {locs: s.searchLocs}));

const ListPane = observer((_, {s}) => h("div#list.pane", null,
    h(MaybeList, {locs: s.locs})));

const MaybeList = ({locs}, {s}) => (
    locs ? h(List, {
        locs,
        locHover: loc => s.enterPreview(loc),
        locLeave: () => s.exitPreview(300),
    }) :
    h(NoList)
);

const NoList = () => h("p", null, "No locations found");

const List = ({locs, locHover, locLeave}) => h("ul.locList", null, [
    h("p", null, `${locs.length} locations`),
    h("div", null, locs.map(loc => h("li", {
        onMouseEnter: () => locHover(loc),
        onMouseLeave: locLeave,
    }, [
        h("h1.callsign", null, h(Link, {href: `/info/${loc.lkey}`}, `${loc.callsign}`)),
        h("p.desc", null, `${loc.desc}`),
        h("p", null, loc.freqs.map(f => dispFreq(f.freq)).join(", ")),
    ])))
]);

const MaybeVisible = ({hidden, children}) => h("div", {
    className: classNames({hidden})
}, children);

const SidebarPanes = observer((_, {s}) => h("div", null, [
    h(MaybeVisible, {hidden: s.curTab !== "info"}, h(MaybeInfo)),
    h(MaybeVisible, {hidden: s.curTab !== "list"}, h(ListPane)),
    h(MaybeVisible, {hidden: s.curTab !== "filters"}, h(Filters)),
    h(MaybeVisible, {hidden: s.curTab !== "search"}, h(SearchPane)),
]));

const Tab = ({active, ...props}) => h("li.nav-item", null,
    h(Link, Object.assign(props, {className: classNames("nav-link", {active})})));

const SidebarTabs = observer((_, {s}) => h("nav", null, h("ul.nav.nav-tabs", [
    h(Tab, {active: s.curTab === "info", href: "/info"}, "Info"),
    h(Tab, {active: s.curTab === "list", href: "/list"}, "List"),
    h(Tab, {active: s.curTab === "filters", href: "/filters"}, "Filters"),
    h(Tab, {active: s.curTab === "search", href: "/search"}, "Search"),
])));

const App = (s, hist) => h(createContext({s, hist}), null, h("main", null, [
    h(SidebarTabs),
    h(SidebarPanes),
]));

export default App;
