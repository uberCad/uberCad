const express = require('express')
const path = require('path')
const app = express()
const http = require('http').Server(app)
const port = process.env.PORT || 5000
const projects = require('./projects')

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

app.get('/api/projects/:filter', (req, res) => {
  let filter = req.param('filter', 'all')

  let result = projects.filter(project => {
    switch (filter) {
      case 'all':
        return true
      case 'shared':
        return !project.members.find(member => member.username === 'Gary')
      case 'archive':
        return project.archive
      default:
        return false
    }
  }).map(project => ({
    id: project.id,
    title: project.title
  }))

  res.json({
    projects: result
  })
  console.log(`request /api/projects/${filter}`)
})

app.get('/api/project/:id', (req, res) => {
  let id = req.param('id', 0)
  let project = projects.find(project => parseInt(project.id) === parseInt(id))
  setTimeout(() => {
    if (project) {
      res.json({project})
    } else {
      res.status(404)
        .send('Not found')
    }

    console.log(`response /api/project/${id}`)
  }, 1500)

  console.log(`request /api/project/${id}`)
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
