import _ from 'lodash'

const obj = {foo: 'foo'}

// _.has(obj, 'foo')

// Post data to parent thread
self.postMessage({foo: 'foo'})

// Respond to message from parent thread
self.addEventListener('message', (event) => {
    console.log('start addEventListener a ')
    console.log('event.data =  ', event.data)
    const a = heavyFunc(event.data.a)
    console.log(event)
    console.log('a = ', a)

    self.postMessage({a})
    self.close()
  }
)

function heavyFunc (length) {
  console.time('marker')
  var str = ''
  for (var i = 0; i < length; i++) {
    str += 'qwerty' + new Date().getTime()
    str = str.split('').reverse().join('')
  }
  //console.log('heavyFunc()');
  console.timeEnd('marker')
  return 200
}
