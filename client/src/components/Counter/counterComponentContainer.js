import {connect} from 'react-redux'
import {changeStateProps} from '../../actions'
import {increment, decrement} from '../../actions/counter'
import CounterComponent from './counterComponent'

const mapStateToProps = (state, ownProps) => {
  console.log('mapStateToProps(state, ownProps)', state, ownProps)
  return {
    count: state.counter.count,
    ...ownProps
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  console.log('mapDispatchToProps = (dispatch, ownProps)', dispatch, ownProps)

  return {
    changeStateProps: (prop, value) => {
      console.log('dispatch(changeStateProps(prop, value))')
      dispatch(changeStateProps(prop, value))
    },
    incrementCount: (val) => {
      let dispatchData = increment()
      console.log('dispatch(increment())', dispatchData, val)

      dispatch(dispatchData)
    },
    decrementCount: () => {
      console.log('dispatch(decrement())')
      dispatch(decrement())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CounterComponent)
