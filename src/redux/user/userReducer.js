import { UserTypes } from "./types";

// initial state
const initialState = {
  currentUser: null,
};

// reducer
export default (state = initialState, action) => {
  switch (action.type) {
    case UserTypes.SET_CURRENT_USER:
      return {
        ...state,
        currentUser: action.payload,
      };

    default:
      return state;
  }
};
