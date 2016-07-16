import promiseMiddleware from "redux-promise";
import thunkMiddleware from "redux-thunk";
import {applyMiddleware, createStore} from "redux";
import {historyMiddleware} from "@kchmck/redux-history-utils";

export default hist => applyMiddleware(
    _ => next => action => Promise.resolve(next(action)),
    promiseMiddleware,
    thunkMiddleware,
    historyMiddleware(hist)
)(createStore);
