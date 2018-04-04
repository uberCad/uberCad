const express = require('express')
const path = require('path')
const app = express()
const http = require('http').Server(app)
const port = process.env.PORT || 5000

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')))

// Put all API endpoints under '/api'
app.get('/api/data', (req, res) => {
    res.json({
        users: [
            {username: 'John', id: 251},
            {username: 'Jane', id: 904}
        ]
    })
    console.log(`request /api/data`)
})

app.get('/api/projects', (req, res) => {
    res.json({
        projects: [
            {title: 'Sample-20', id: 251},
            {title: 'Project Tango', id: 904}
        ]
    })
    console.log(`request /api/projects`)
})

app.get('/api/file.dxf', (req, res) => {
    res.sendFile(path.join(__dirname, '/dxf/sample20-ok.dxf'))
    console.log(`request /api/file.dxf`)
})

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/build/index.html'))
})

http.listen(port, function () {
    console.log(`Server running at localhost:${port}`)
})
