export const SPINNER_SHOW = 'SPINNER_SHOW'
export const SPINNER_HIDE = 'SPINNER_HIDE'

export const spinnerShow = () => {
  return {
    type: SPINNER_SHOW
  }
}

export const spinnerHide = () => {
  return {
    type: SPINNER_HIDE
  }
}
