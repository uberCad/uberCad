import React from 'react'
import { Field, FieldArray, formValueSelector, reduxForm } from 'redux-form'
import consoleUtils from '../../services/consoleUtils'
import { FormattedMessage } from 'react-intl'
import { connect } from 'react-redux'
import './OrderForm.css'

/*
const normalizePhone = (value, previousValue) => {
  if (!value) {
    return value
  }
  const onlyNums = value.replace(/[^\d]/g, '')
  if (!previousValue || value.length > previousValue.length) {
    // typing forward
    if (onlyNums.length === 4) {
      return onlyNums + '-'
    }
    if (onlyNums.length === 7) {
      return onlyNums.slice(0, 4) + '-' + onlyNums.slice(4) + '-'
    }
  }
  if (onlyNums.length <= 4) {
    return onlyNums
  }
  if (onlyNums.length <= 7) {
    return onlyNums.slice(0, 4) + '-' + onlyNums.slice(4)
  }
  return onlyNums.slice(0, 4) + '-' + onlyNums.slice(4, 7) + '-' + onlyNums.slice(7, 11)
}
*/

const validate = (values) => {
  const errors = {}
  if (!values.firstName) {
    errors.firstName = 'Required'
  }
  if (!values.lastName) {
    errors.lastName = 'Required'
  }
  if (!values.company) {
    errors.company = 'Required'
  }
  if (!values.addressCountry) {
    errors.addressCountry = 'Country required'
  }
  if (!values.addressCity) {
    errors.addressCity = 'City required'
  }
  if (!values.addressStreet) {
    errors.addressStreet = 'Street required'
  }
  if (!values.zipCode) {
    errors.zipCode = 'Required'
  }
  if (!values.phoneNumber) {
    errors.phoneNumber = 'Phone number required'
  }
  // else if (!/\d{4}-\d{3}-\d{4}/g.test(values.phoneNumber)) {
  //   errors.phoneNumber = 'Invalid phone Number, 1234-123-4567'
  // }
  if (!values.emailAddress) {
    errors.emailAddress = 'Required'
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.emailAddress)) {
    errors.emailAddress = 'Invalid email address'
  }
  return errors
}

const renderField = ({input, label, type, className, minOrderQty, defaultVal, meta: {touched, error}}) => (
  <div className='form-group'>
    <label className='col-md-4 control-label'>{label}</label>
    <div className='col-md-6'>
      <input {...input}
             value={input.value || defaultVal}
             type={type}
             placeholder={label}
             className={className ? className : 'form-control input-md'}
      />

      {touched && error && <span>{error}</span>}

      {label === 'Order quantity' && input.value < minOrderQty &&
      <span className='warning'> min quantity {minOrderQty}</span>}
      {label === 'Length' && (input.value < 3 || input.value > 7) &&
      <span className='warning'>The length should be in the range of 3 to 7 meters</span>}
    </div>
  </div>
)

const renderContactField = ({input, label, icon, type, className, minOrderQty, defaultVal, meta: {touched, error}}) => (
  <div className={(touched && error) ? 'form-group has-error' : 'form-group'}>
    <label className='col-md-4 control-label' htmlFor='firstName'>{label}</label>
    <div className='col-md-4'>
      <div className='input-group'>
        <div className='input-group-addon input-addon'>
          <i className={icon}>
          </i>
        </div>
        <input {...input}
               value={input.value || defaultVal}
               type={type}
               placeholder={label}
               className={className ? className : 'form-control input-md'}
        />
      </div>
    </div>
    <div className='col-md-4 warning'>
      {touched && error && <span>{error}</span>}
    </div>
  </div>
)

const RenderObjects = ({objects, checkObjects}) => {
  return (
    <ul className='polyamide-list'>
      {objects && objects.map((object, i) => {
        return (
          <li
            className={(checkObjects && checkObjects[i] && checkObjects[i].checked) ? 'list-group-flush' : 'list-group-flush disabled'}
            key={i}>
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
                  defaultVal={6}
                />

                <Field
                  name={`objects[${i}].orderQty`}
                  type='number'
                  component={renderField}
                  label='Order quantity'
                  minOrderQty={object.userData.minOrderQty}
                  defaultVal={object.userData.minOrderQty}
                />
              </div>)}
          </li>)
      })}
    </ul>
  )
}

let OrderForm = props => {
  const {checkObjects} = props
  return (
    <div className='row'>
      <div>
        <form className='form-horizontal form-custom' onSubmit={(values) => { console.log(values)}}>
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
            <Field
              name='firstName'
              type='text'
              component={renderContactField}
              label='First Name'
              icon='fa fa-user'
              defaultVal=''
            />
            <Field
              name='lastName'
              type='text'
              component={renderContactField}
              label='Last Name'
              icon='fa fa-male'
              defaultVal=''
            />
            <Field
              name='company'
              type='text'
              component={renderContactField}
              label='Company'
              icon='fa fa-institution'
              defaultVal=''
            />
            <Field
              name='addressCountry'
              type='text'
              component={renderContactField}
              label='Country'
              defaultVal=''
            />
            <Field
              name='addressCity'
              type='text'
              component={renderContactField}
              label='City'
              defaultVal=''
            />
            <Field
              name='addressStreet'
              type='text'
              component={renderContactField}
              label='Street'
              defaultVal=''
            />
            <Field
              name='zipCode'
              type='text'
              component={renderContactField}
              label='Zip Code/Zone'
              defaultVal=''
            />
            <Field
              name='phoneNumber'
              type='text'
              component={renderContactField}
              label='Phone number'
              icon='fa fa-phone'
              defaultVal=''
              // normalize={normalizePhone}
            />
            <Field
              name='emailAddress'
              type='email'
              component={renderContactField}
              label='Email address'
              icon='fa fa-envelope-o'
              defaultVal=''
            />
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
