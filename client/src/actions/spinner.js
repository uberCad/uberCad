export const SPINNER_SHOW = 'SPINNER_SHOW';
export const SPINNER_HIDE = 'SPINNER_HIDE';

export const spinnerShow = () => {
    console.log('spinnerShow()')
    return {
        type: SPINNER_SHOW
    }
}

export const spinnerHide = () => {
    console.log('spinnerHide()')
    return {
        type: SPINNER_HIDE
    }
}
