'use strict'

let express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  http = require('http').Server(app),
  port = process.env.PORT || 5000,
  // config = require('./server/config'),
  fileUpload = require('express-fileupload')

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
        'Cookie': '_ga=GA1.2.1559297713.1526561399; _ym_uid=152656139928282416; session_id=1e4aab7960b17db265729320eb6e6b0c9ce9e036; website_lang=en_US; _gid=GA1.2.1665699095.1529597960; _ym_visorc_33983905=w; _ym_isad=1',
        'Content-Type': 'application/json',
      },
      json: true,
    }, function (error, response, body) {
      //Print the Response
      console.log(body)
      res.json({message: body})
    })
})

app.use('/api', router);

http.listen(port, function () {
  console.log(`Server running at localhost:${port}`)
})