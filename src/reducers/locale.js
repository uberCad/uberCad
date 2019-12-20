import { LOCALE_SET } from '../actions/locale';

let initialState = {
  lang: 'en'
};

const locale = (state = initialState, action) => {
  switch (action.type) {
    case LOCALE_SET:
      return {
        ...state,
        lang: action.payload.lang
      };

    default:
      return state;
  }
};

export default locale;
