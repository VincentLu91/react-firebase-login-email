import {LanguageTypes} from './types'

// initial state
const initialState = {
    transcriptionText: null,
}

// reducer
export default (state = initialState, action) => {
    switch (action.type) {
        case LanguageTypes.PRINT_TRANSCRIPTION:
            return { 
                ...state,
                transcriptionText: action.payload,
            };
        
        default:
            return state;
    }
}