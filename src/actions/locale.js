export const LOCALE_SET = 'LOCALE_SET'

export const setLocale = (lang) => {
  return dispatch => {
    dispatch({
      type: LOCALE_SET,
      payload: {lang}
    })
  }
}
