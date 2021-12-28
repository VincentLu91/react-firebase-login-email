import { inMemoryPersistence } from "firebase/auth";
import { UserTypes } from "./types";

// initial state
const initialState = {
  currentUser: null,
};

// reducer
export default (state = initialState, action) => {
  console.log("Action: ", action);
  switch (action.type) {
    case UserTypes.SET_CURRENT_USER:
      console.log("Action payload: ", action.payload);
      return {
        ...state,
        currentUser: action.payload,
        //uid: action.payload.user?.uid,
      };

    default:
      return state;
  }
};
