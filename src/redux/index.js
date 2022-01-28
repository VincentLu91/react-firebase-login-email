import { createStore, combineReducers, applyMiddleware } from "redux";
import { persistStore, persistReducer } from "redux-persist"; // imports from redux-persist
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import recordingAudioReducer from "./recording/recordingAudioReducer";
import userReducer from "./user/userReducer";
import languageReducer from "./language/languageReducer";

const allReducers = combineReducers({
  recordingReducer: recordingAudioReducer,
  user: userReducer,
  languageReducer: languageReducer,
});

const persistConfig = {
  // configuration object for redux-persist
  key: "root",
  storage, // define which storage to use
};

const persistedReducer = persistReducer(persistConfig, allReducers); // create a persisted reducer

const store = createStore(persistedReducer, applyMiddleware());
const persistor = persistStore(store); // used to create the persisted store, persistor will be used in the next step
export default store;
export { persistor };
//export default createStore(allReducers);
