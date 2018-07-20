'use strict'

let express = require('express')
let app = express()
let bodyParser = require('body-parser')
let http = require('http').Server(app)
let path = require('path')
let port = process.env.PORT || 5000
// let config = require('./server/config')
let fileUpload = require('express-fileupload')

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization,X-Session-Id')
  res.setHeader('Access-Control-Allow-Credentials', true)
  next()
})

app.use(bodyParser.json({limit: '50mb'}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))

app.use(fileUpload())

let router = express.Router()

router.post('/flixo', function (req, res) {
  // console.log('req', req.body);

  // res.json({ message: JSON.stringify(req.body.id) });

  let request = require('request')

  request(
    {
      method: 'POST',
      url: 'https://thermevo.de/flixo/post_svg_file_json',
      body: req.body,
      headers: {
        'Cookie': 'website_lang=en_US; _ga=GA1.2.1463665294.1528200908; _gid=GA1.2.1457081784.1528200908; _ym_uid=1528200908275609853; _ym_visorc_33983905=w; _ym_isad=2; session_id=0f40fbea1b687077bb9b966fa5a4f64616a90da5',
        'Content-Type': 'application/json'
      },
      json: true
    }, function (error, response, body) {
      // Print the Response
      console.log(body)
      res.json({message: body, error})
    })
})

app.use('/api', router)

app.use('/', express.static(path.join(__dirname, 'build')))

http.listen(port, function () {
  console.log(`Server running at localhost:${port}`)
})
