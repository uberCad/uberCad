export const changeStateProps = (prop, value) => {
  console.log('ACTIONS: changeStateProps(prop, value)', prop, value)
  return {
    type: 'CHANGE_STATE_PROPS',
    state: {
      prop,
      value
    }
  }
}
