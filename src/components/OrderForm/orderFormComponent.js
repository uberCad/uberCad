import React from 'react'
import { Field, FieldArray, formValueSelector, reduxForm } from 'redux-form'
import consoleUtils from '../../services/consoleUtils'
import { FormattedMessage } from 'react-intl'
import { connect } from 'react-redux'
import './OrderForm.css'

const validate = (values) => {
  const errors = {}
  if (!values.firstName) {
    errors.firstName = 'Required'
  }
  if (values) {
    // console.log('values', values)
  }

  return errors
}

const renderField = ({input, label, type, className, minOrderQty, meta: {touched, error}}) => (
  <div className='form-group'>
    <label className='col-md-4 control-label'>{label}</label>
    <div className='col-md-6'>
      <input {...input}
             type={type}
             placeholder={label}
             className={className ? className : 'form-control input-md'}/>

      {touched && error && <span>{error}</span>}

      {label === 'Order quantity' && input.value < minOrderQty &&
      <span className='warning'> min quantity {minOrderQty}</span>}
      {label === 'Length' && (input.value < 3 || input.value > 7) &&
      <span className='warning'>The length should be in the range of 3 to 7 meters</span>}
    </div>
  </div>
)

const RenderObjects = ({objects, checkObjects}) => {
  return (
    <ul className='polyamide-list'>
      {objects && objects.map((object, i) => {
        return (
          <li className={(checkObjects[i] && checkObjects[i].checked) ? 'list-group-flush' : 'list-group-flush disabled'} key={i}>
            <Field
              name={`objects[${i}].checked`}
              type='checkbox'
              component='input'
              label=''
              className='checkObject'
            />

            <FormattedMessage id='calculatePrice.modal.object' defaultMessage='Object'>
              {value => <h4>{value}: {object.name}</h4>}
            </FormattedMessage>
            < FormattedMessage
              id='calculatePrice.modal.material'
              defaultMessage='Material'>
              {value => <h3>{value}: {object.userData.material.name}</h3>}
            </FormattedMessage>
            <FormattedMessage id='calculatePrice.modal.width' defaultMessage='Width'>
              {value =>
                <span>{value}: {Number(object.userData.info.width.toFixed(4))} mm</span>
              }
            </FormattedMessage>
            <FormattedMessage id='calculatePrice.modal.height' defaultMessage='Height'>
              {value =>
                <span>{value}: {Number(object.userData.info.height.toFixed(4))} mm</span>
              }
            </FormattedMessage>
            <FormattedMessage id='calculatePrice.modal.area' defaultMessage='Area'>
              {value =>
                <span>{value}: {Number(object.userData.info.area.toFixed(4))} mm2</span>
              }
            </FormattedMessage>
            <FormattedMessage id='calculatePrice.modal.weight' defaultMessage='Weight'>
              {value =>
                <span>{value}: {Number(object.userData.info.weight).toFixed(4)} kg/m</span>
              }
            </FormattedMessage>
            {object.userData.price &&
            <FormattedMessage id='calculatePrice.modal.price' defaultMessage='Unit price'>
              {value =>
                <span><b>{value}: {object.userData.price}</b></span>
              }
            </FormattedMessage>}
            <span className='profile col-sm-4 .col-md-4 .col-xs-4'>{consoleUtils.getSvg(object)}</span>


            {checkObjects && checkObjects[i] && checkObjects[i].checked && (
              <div className='panel panel-default panel-options'>
              <Field
                name={`objects[${i}].laserMarking`}
                type='checkbox'
                component={renderField}
                label='Laser marking'
              />

              {checkObjects[i] && checkObjects[i].laserMarking && (<div>
                <div className='form-group'>
                  <label className='col-md-4 control-label'>Type</label>
                  <div className='col-md-6'>
                    <Field name={`objects[${i}].type`} component='select' className='form-control input-md'>
                      <option/>
                      <option value='standart'>Standart</option>
                      <option value='logo'>Logo</option>
                    </Field>
                  </div>
                </div>

                <div className='form-group'>
                  <label className='col-md-4 control-label'>Color</label>
                  <div className='col-md-6'>
                    <Field name={`objects[${i}].color`} component='select' className='form-control input-md'>
                      <option/>
                      <option value='white'>White</option>
                      <option value='grey'>Grey</option>
                    </Field>
                  </div>
                </div>
              </div>)}

              <Field
                name={`objects[${i}].length`}
                type='number'
                component={renderField}
                label='Length'
              />

              <Field
                name={`objects[${i}].orderQty`}
                type='number'
                component={renderField}
                label='Order quantity'
                minOrderQty={object.userData.minOrderQty}
              />
            </div>)}
          </li>)
      })}
    </ul>
  )
}

let OrderForm = props => {
  const {handleSubmit, checkObjects} = props
  return (
    <div className='row'>
      <div>
        <form className='form-horizontal form-custom' onSubmit={handleSubmit}>
          <div>
            <legend>Objects information</legend>

            <FieldArray name='objects'
                        component={RenderObjects}
                        objects={props.objects}
                        checkObjects={checkObjects}
            />
          </div>

          <div>
            <legend>Contact Information</legend>
            {/*Text input First-Name*/}
            <div className='form-group'>
              <label className='col-md-4 control-label' htmlFor='firstName'>First Name</label>
              <div className='col-md-4'>
                <div className='input-group'>
                  <div className='input-group-addon input-addon'>
                    <i className='fa fa-user'>
                    </i>
                  </div>


                  <Field name='firstName' component='input' type='text' placeholder='First Name'
                         className='form-control input-md'/>
                </div>
              </div>
            </div>

            {/*Text input Last Name*/}
            <div className='form-group'>
              <label className='col-md-4 control-label' htmlFor='lastName'>Last Name</label>
              <div className='col-md-4'>
                <div className='input-group'>
                  <div className='input-group-addon input-addon'>
                    <i className='fa fa-male'/>

                  </div>
                  <Field name='lastName' component='input' type='text' placeholder='Last Name'
                         className='form-control input-md'/>
                </div>
              </div>
            </div>

            {/*Text input Company*/}
            <div className='form-group'>
              <label className='col-md-4 control-label' htmlFor='company'>Company</label>
              <div className='col-md-4'>
                <div className='input-group'>
                  <div className='input-group-addon input-addon'>
                    <i className='fa fa-institution'/>
                  </div>
                  <Field name='company' component='input' type='text' placeholder='Company'
                         className='form-control input-md'/>
                </div>
              </div>
            </div>

            {/*Text input place*/}
            <div className='form-group'>
              <label className='col-md-4 control-label col-xs-12' htmlFor='addressCountry'>Address</label>
              <div className='col-md-2  col-xs-4'>
                <Field name='addressCountry' component='input' type='text' placeholder='Country'
                       className='form-control input-md'/>
              </div>
              <div className='col-md-2 col-xs-4'>
                <Field name='addressCity' component='input' type='text' placeholder='City'
                       className='form-control input-md'/>
              </div>
            </div>

            <div className='form-group'>
              <label className='col-md-4 control-label' htmlFor='addressStreet'>Street</label>
              <div className='col-md-4  col-xs-4'>
                <Field name='addressStreet' component='input' type='text' placeholder='Street'
                       className='form-control input-md'/>
              </div>
            </div>

            <div className='form-group'>
              <label className='col-md-4 control-label col-xs-12' htmlFor='zipCode'>Zip Code/Zone</label>
              <div className='col-md-4  col-xs-4'>
                <Field name='zipCode' component='input' type='text' placeholder='Zip Code/Zone'
                       className='form-control input-md'/>
              </div>
            </div>

            {/*Text input Phone number*/}
            <div className='form-group'>
              <label className='col-md-4 control-label' htmlFor='phoneNumber '>Phone number </label>
              <div className='col-md-4'>
                <div className='input-group'>
                  <div className='input-group-addon input-addon'>
                    <i className='fa fa-phone'/>
                  </div>
                  <Field name='phoneNumber' component='input' type='number' placeholder='Phone number'
                         className='form-control input-md'/>
                </div>
              </div>
            </div>

            {/*Text input Email Address*/}
            <div className='form-group'>
              <label className='col-md-4 control-label' htmlFor='emailAddress'>Email Address</label>
              <div className='col-md-4'>
                <div className='input-group'>
                  <div className='input-group-addon input-addon'>
                    <i className='fa fa-envelope-o'/>
                  </div>
                  <Field name='emailAddress' component='input' type='email' placeholder='Email address'
                         className='form-control input-md'/>
                </div>
              </div>
            </div>

            <div className='form-group'>
              <label className='col-md-4 control-label' htmlFor='comment'>Сomment</label>
              <div className='col-md-4'>
                <Field name='comment' component='textarea' className='form-control' rows='3'
                       placeholder='Your comment to the order'/>
              </div>
            </div>
          </div>
          {/*<input type='submit' value='Form Submit button'/>*/}
        </form>
      </div>
    </div>
  )
}

OrderForm = reduxForm({
  form: 'order',
  validate,
  destroyOnUnmount: false
})(OrderForm)

// Decorate with connect to read form values
const selector = formValueSelector('order') // <-- same as form name

OrderForm = connect(state => {
  // can select values individually
  const checkObjects = selector(state, 'objects')
  // or together as a group
  // const { firstName, lastName } = selector(state, 'firstName', 'lastName')
  return {
    checkObjects
  }
})(OrderForm)

export default OrderForm
