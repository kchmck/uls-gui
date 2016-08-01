import LazyInput from "lazy-input";
import React from "react";
import classNames from "classnames";
import marked from "marked";
import {Link} from "@kchmck/redux-history-utils";
import {Provider, connect} from "react-redux";

import * as actions from "../actions";
import {locUrl, freqUrl} from "../urls";
import {VIS} from "../visibility";

import {
    calcSReading,
    parseEmission,
    createDebounce,
} from "../util";

let previewDebounce = createDebounce(100);

const onEvent = fn => e => {
    e.preventDefault();
    return fn(e);
};

const Icon = ({name}) => <span className={`fa fa-${name}`} />;

const ControlButton = ({active, ...props}) =>
    <button className={classNames("btn btn-secondary", {active})} {...props} />;

const CatButton = connect(
    ({locCat}, {lkey}) => ({
        curCat: locCat[lkey]
    }),
    actions
)(
    ({curCat, toggleCat, cat, lkey, title, children}) =>
        <ControlButton
            active={curCat === cat}
            onClick={() => toggleCat(lkey, cat)}
            title={title}
        >
            {children}
        </ControlButton>
);

const LocControls = connect(null, actions)(
    ({lkey, setCurCenter}) => (
        <div id="controls">
            <div className="btn-group btn-group-sm">
                <ControlButton onClick={() => setCurCenter()} title="Center">
                    <Icon name="crosshairs" />
                </ControlButton>
                <CatButton lkey={lkey} cat={VIS.IGNORED} title="Ignore">
                    <Icon name="ban" />
                </CatButton>
                <CatButton lkey={lkey} cat={VIS.REVIEWING} title="Review">
                    <Icon name="eye" />
                </CatButton>
                <CatButton lkey={lkey} cat={VIS.CONFIRMED} title="Confirm">
                    <Icon name="check" />
                </CatButton>
            </div>
        </div>
    )
);

const NotesText = ({notes}) =>
    <div dangerouslySetInnerHTML={{__html: marked(notes)}} />;

const NoNotes = () => <p><em>No notes recorded</em></p>;

const MaybeShowNotes = ({notes}) => <div id="noteText">
    {notes ? <NotesText notes={notes} /> : <NoNotes />}
</div>;

const EditNotes = connect(({editNotes}) => ({editNotes}), actions)(
    ({editNotes, changeNotes, commitNotes, discardNotes, lkey}) => <div>
        <fieldset className="form-group">
            <label htmlFor="editNotes" className="sr-only">
                Enter location notes
            </label>
            <LazyInput type="textarea" className="form-control" id="editNotes"
                rows="3" value={editNotes} autoFocus
                onChange={e => changeNotes(e.target.value)} />
        </fieldset>
        <fieldset className="btn-group btn-group-sm">
            <button className="btn btn-primary"
                onClick={() => commitNotes(lkey)}
            >
                 <Icon name="floppy-o" /> Save
            </button>
            <button className="btn btn-secondary"
                onClick={() => discardNotes()}
            >
                 Cancel
            </button>
        </fieldset>
    </div>
 );

const ShowNotes = connect(({notes}) => ({notes}), actions)(
    ({notes, startEditNotes, lkey}) => <div>
        <MaybeShowNotes notes={notes[lkey]} />
        <fieldset className="form-group">
            <button className="btn btn-secondary btn-sm"
                onClick={() => startEditNotes(lkey)}
            >
                <span className="fa fa-pencil" /> Edit
            </button>
        </fieldset>
    </div>
);

const Notes = connect(({editingNotes}) => ({editingNotes}), actions)(
    ({editingNotes, lkey}) => <div id="notes">
        {editingNotes ? <EditNotes lkey={lkey} /> : <ShowNotes lkey={lkey} />}
    </div>
);

const Heading = connect(({curLoc}) => curLoc)(
    ({rkey, lkey, callsign, desc}) => <div>
        <h1><a href={locUrl(rkey, lkey)}>{callsign}</a></h1>
        <p className="desc" title={desc}>{desc}</p>
        <LocControls lkey={lkey} />
        <h2>Notes</h2>
        <Notes lkey={lkey} />
    </div>
);

const Emission = ({raw, bandwidth, modulation, signal, info}) => (
    <li title={raw}>
        {bandwidth / 1.0e3}kHz, {modulation}, {signal}, {info}
    </li>
);

const Freq = ({rkey, fkey, freq, power, rxPower, emissions}) => (
    <div className="freq">
        <div className="row">
            <h2 className="col-xs-10">
                <a href={freqUrl(rkey, fkey)}
                    title={`${freq}Hz`}
                >
                    {dispFreq(freq)}MHz
                </a>
            </h2>
            <div className="sReading col-xs-2" title={`${power / 1.0e3}W`}>
                {calcSReading(rxPower)}
            </div>
        </div>
        <ul>
        {emissions.map((e, key) =>
            <Emission key={key} raw={e} {...parseEmission(e)} />)}
        </ul>
    </div>
);

const Freqs = connect(({curLoc}) => ({
    rkey: curLoc.rkey,
    freqs: curLoc.freqs,
}))(
    ({rkey, freqs}) => <div>
        {Object.values(freqs).map((freq, key) =>
            <Freq key={key} rkey={rkey} {...freq} />)}
    </div>
);

const Info = () => <div>
    <Heading />
    <Freqs />
</div>;

const NoInfo = () => <p><em>No location selected</em></p>;

const MaybeInfo = connect(({curLoc}) => ({curLoc}))(
    ({curLoc}) => <div id="info" className="pane">
        {curLoc ? <Info /> : <NoInfo />}
    </div>
);

const onFilterChange = (id, changeFilter, proc) =>
    onEvent(e => changeFilter(id, proc(parseFloat(e.target.value))));

const procFreq = freq => freq * 1.0e6;
const dispFreq = freq => freq / 1.0e6;

const defaultDisp = x => x;
const defaultProc = x => x;

const FilterInput = connect(({editFilters}, {id}) => ({
    val: editFilters[id],
}), actions)(
    ({val, id, changeFilter, disp=defaultDisp, proc=defaultProc}) => (
        <LazyInput type="text" id={id} className="form-control"
            value={disp(val)}
            onChange={onFilterChange(id, changeFilter, proc)} />
    )
);

const FilterVisibility = connect(
    ({editFilters}) => ({vis: editFilters.vis}),
    actions
)(
    ({vis, toggleFilterVis, visFlag, title, children}) => (
        <button
            className={classNames("btn btn-secondary", {
                active: (vis & visFlag) !== 0,
            })}
            onClick={onEvent(() => toggleFilterVis(visFlag))}
            title={title}
        >
            {children}
        </button>
    )
);

const Filters = connect(null, actions)(
    ({commitFilters}) => (
        <form onSubmit={onEvent(commitFilters)}>
            <fieldset className="form-group">
                <label htmlFor="freqLower">Lower frequency</label>
                <div className="input-group">
                    <FilterInput id="freqLower" disp={dispFreq} proc={procFreq} />
                    <div className="input-group-addon">MHz</div>
                </div>
            </fieldset>
            <fieldset className="form-group">
                <label htmlFor="freqUpper">Upper frequency</label>
                <div className="input-group">
                    <FilterInput id="freqUpper" disp={dispFreq} proc={procFreq} />
                    <div className="input-group-addon">MHz</div>
                </div>
            </fieldset>
            <fieldset className="form-group">
                <label htmlFor="rxPowerLower">Receive power</label>
                <div className="input-group">
                    <FilterInput id="rxPowerLower" />
                    <div className="input-group-addon">dBm</div>
                </div>
            </fieldset>
            <fieldset className="form-group" id="visibility">
                <label htmlFor="visibility">Visibility</label>
                <div className="btn-group btn-block">
                    <FilterVisibility visFlag={VIS.UNCONFIRMED} title="Unconfirmed">
                        <Icon name="question" />
                    </FilterVisibility>
                    <FilterVisibility visFlag={VIS.IGNORED} title="Ignored">
                        <Icon name="ban" />
                    </FilterVisibility>
                    <FilterVisibility visFlag={VIS.REVIEWING} title="Reviewing">
                        <Icon name="eye" />
                    </FilterVisibility>
                    <FilterVisibility visFlag={VIS.CONFIRMED} title="Confirmed">
                        <Icon name="check" />
                    </FilterVisibility>
                    <FilterVisibility visFlag={VIS.ANNOTATED} title="Annotated">
                        <Icon name="pencil" />
                    </FilterVisibility>
                </div>
            </fieldset>
            <button type="submit" className="btn btn-primary">Filter</button>
        </form>
    )
);

const MaybeList = connect(({locs}) => ({locs}), actions)(
    ({locs, setCenter, setPreviewLoc, resetPreviewLoc}) => locs ?
        <List locs={locs}
            locHover={loc => () => previewDebounce(() => {
                setCenter(loc);
                setPreviewLoc(loc);
            })}
            locLeave={_ => () => previewDebounce(resetPreviewLoc)}
        /> :
        <NoList />
);

const NoList = () => <p>No locations found</p>;

const List = ({locs, locHover, locLeave}) => (
    <ul id="list" className="pane">
        <p>{locs.length} locations</p>
        {locs.map(loc =>
            <li key={loc.lkey}
                onMouseEnter={locHover(loc)}
                onMouseLeave={locLeave(loc)}
            >
                <h1><Link to={`/info/${loc.lkey}`}>{loc.callsign}</Link></h1>
                <p className="desc">{loc.desc}</p>
            </li>
        )}
    </ul>
);

const Tab = ({active, ...props}) => (
    <li className="nav-item">
        <Link className={classNames("nav-link", {active})} {...props} />
    </li>
);

const Tabs = ({children}) => <nav>
    <ul className="nav nav-tabs">{children}</ul>
</nav>;

const SidebarTabs = connect(({curTab}) => ({
    curTab,
}))(
    ({curTab}) => (
        <Tabs>
            <Tab active={curTab === "info"} to="/info">Info</Tab>
            <Tab active={curTab === "list"} to="/list">List</Tab>
            <Tab active={curTab === "filters"} to="/filters">Filters</Tab>
        </Tabs>
    )
);

const SidebarPanes = connect(({curTab}) => ({curTab}))(
    ({curTab}) => <div>
        {curTab === "filters" && <Filters />}
        {curTab === "list" && <MaybeList />}
        {curTab === "info" && <MaybeInfo />}
    </div>
);

const Main = () => <div>
    <SidebarTabs />
    <SidebarPanes />
</div>;

const App = props => (
    <Provider {...props}>
        <Main />
    </Provider>
);

export default App;
