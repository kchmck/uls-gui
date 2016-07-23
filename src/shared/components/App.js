import React from "react";
import classNames from "classnames";
import {Link} from "@kchmck/redux-history-utils";
import {Provider} from "react-redux";
import {connect} from "react-redux";

import * as actions from "../actions/app";
import {locUrl, freqUrl} from "../urls";

import {
    calcSReading,
    parseEmission,
} from "../util";

const onEvent = fn => e => {
    e.preventDefault();
    return fn(e);
};

const Heading = connect(({app}) => app.curLoc)(
    ({rkey, lkey, callsign, desc}) => <div>
        <h1><a href={locUrl(rkey, lkey)}>{callsign}</a></h1>
        <p>{desc}</p>
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
                <a href={freqUrl(rkey, fkey)}>{dispFreq(freq)}MHz</a>
            </h2>
            <p className="col-xs-2" title={`${power / 1.0e3}W`}>
                {calcSReading(rxPower)}
            </p>
        </div>
        <ul>
        {emissions.map((e, key) =>
            <Emission key={key} raw={e} {...parseEmission(e)} />)}
        </ul>
    </div>
);

const Freqs = connect(({app}) => ({
    rkey: app.curLoc.rkey,
    freqs: app.curLoc.freqs,
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

const NoInfo = () => <p>No location selected</p>;

const MaybeInfo = ({active}) => <div id="info">
    {active && <Info /> || <NoInfo />}
</div>;

const onFilterChange = (changeFilter, proc) => onEvent(e => {
    let val = parseFloat(e.target.value);
    return changeFilter(e.target.id, proc ? proc(val) : val);
});

const procFreq = freq => freq * 1.0e6;
const dispFreq = freq => freq / 1.0e6;

const Filters = connect(
    ({app}) => app.editFilters,
    actions
)(
    ({freqLower, freqUpper, rxPowerLower, changeFilter, commitFilters}) => (
        <form onSubmit={onEvent(commitFilters)}>
            <fieldset className="form-group">
                <label htmlFor="freqLower">Lower frequency</label>
                <div className="input-group">
                    <input type="text" className="form-control" id="freqLower"
                        value={dispFreq(freqLower)}
                        onChange={onFilterChange(changeFilter, procFreq)} />
                    <div className="input-group-addon">MHz</div>
                </div>
            </fieldset>
            <fieldset className="form-group">
                <label htmlFor="freqUpper">Upper frequency</label>
                <div className="input-group">
                    <input type="text" className="form-control" id="freqUpper"
                        value={dispFreq(freqUpper)}
                        onChange={onFilterChange(changeFilter, procFreq)} />
                    <div className="input-group-addon">MHz</div>
                </div>
            </fieldset>
            <fieldset className="form-group">
                <label htmlFor="rxPowerLower">Receive power</label>
                <div className="input-group">
                    <input type="text" className="form-control" id="rxPowerLower"
                        value={rxPowerLower}
                        onChange={onFilterChange(changeFilter)} />
                    <div className="input-group-addon">dBm</div>
                </div>
            </fieldset>
            <button type="submit" className="btn btn-primary">Filter</button>
        </form>
    )
);

const Tab = ({active, ...props}) => (
    <li className="nav-item">
        <Link className={classNames("nav-link", {active})} {...props} />
    </li>
);

const Tabs = ({children}) => <nav>
    <ul className="nav nav-tabs">{children}</ul>
</nav>;

const SidebarTabs = connect(({app}) => ({
    curTab: app.curTab,
}))(
    ({curTab}) => (
        <Tabs>
            <Tab active={curTab == "info"} to="/info">Info</Tab>
            <Tab active={curTab == "list"} to="/list">List</Tab>
            <Tab active={curTab == "filters"} to="/filters">Filters</Tab>
        </Tabs>
    )
);

const SidebarPanes = connect(({app}) => ({
    curTab: app.curTab,
    curLoc: app.curLoc,
}))(
    ({curTab, curLoc}) => <div>
        {curTab == "filters" && <Filters />}
        {curTab == "info" && <MaybeInfo active={!!curLoc} />}
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
