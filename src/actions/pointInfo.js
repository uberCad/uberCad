export const POINT_INFO_ACTIVE = 'POINT_INFO_ACTIVE';
export const POINT_INFO_MOVE = 'POINT_INFO_MOVE';
export const POINT_INFO_DISABLE = 'POINT_INFO_DISABLE';

export const activePoint = () => {
  return dispatch =>
    dispatch({
      type: POINT_INFO_ACTIVE,
      payload: {
        style: {
          display: 'block'
        }
      }
    });
};

export const movePointInfo = (event, msg) => {
  // TODO: why do we need that?
  return dispatch =>
    dispatch({
      type: POINT_INFO_MOVE,
      payload: {
        style: {
          display: 'block',
          left: `${event.pageX + 20}px`,
          top: `${event.pageY + 20}px`,
          padding: '0',
          color: 'black'
        },
        message: msg
      }
    });
};

export const disablePoint = () => {
  return dispatch =>
    dispatch({
      type: POINT_INFO_DISABLE,
      payload: {
        style: {
          display: 'none'
        },
        message: ''
      }
    });
};
