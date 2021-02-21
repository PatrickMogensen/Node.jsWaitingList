const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const session = require('express-session')
const authentication = require('./util/authentication.js')
const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const indexRouter = require('./routes/index')
const usersRouter = require('./routes/users')
const loginRouter = require('./routes/login')
const registerRouter = require('./routes/register')

const mysql = require('mysql')
app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

const sessionMiddleware = session({
  secret: 'sessionSecret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
})

app.use(sessionMiddleware)

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next)
  // sessionMiddleware(socket.request, socket.request.res, next); will not work with websocket-only
  // connections, as 'socket.request.res' will be undefined in that case
})

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/login', loginRouter)

const connection = mysql.createConnection({
  host: 'database-2.cqhj7tyf9brs.us-east-1.rds.amazonaws.com',
  user: 'admin',
  port: '3306',
  password: 'password',
  database: 'waiting_list'
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const connections = []

io.on('connection', (socket) => {
  const user = { sessionId: socket.request.session.userId, socketId: socket.id }
  connections.push(user)

  socket.on('disconnect', () => {
    for (let i = 0; i < connections.length; i++) {
      if (connections[i].socketId == socket.id) {
        connections.splice(i, 1)
        console.log('con' + JSON.stringify(connections))
      }
    }
    console.log('A socket disconnected. byeeeeeee' + socket.id)
  })

  socket.on('offer submitted', (housingDepartmentId, message, number) => {
    const sql = 'SELECT * FROM waiting_list.waiting_list WHERE waiting_list.waiting_list.housing_department_id = ? LIMIT ?;'
    connection.query(sql, [housingDepartmentId, parseInt(number)], function (err, recipients) {
      if (err) throw err
      console.log(recipients)

      for (let i = 0; i < connections.length; i++) {
        for (let j = 0; j < recipients.length; j++) {
          if (connections[i].sessionId == recipients[j].user_id) {
            console.log(recipients[j].user_id)

            io.to(connections[i].socketId).emit('notification', message)
          }
        }
      }
    })
  })
})

const port = process.env.PORT || 8080;

http.listen(port, (error) => {
  console.log('listening on ' + port)
})

app.get('/send-offer', function (req, res) {
  res.sendfile('public/sendOffer.html')
})

app.get('/housing-department', function (req, res) {
  res.sendfile('public/housingDepartmentInfo.html')
})

app.get('/housing-departments', function (req, res) {
  res.sendfile('public/housingDepartmentsOverview.html')
})

app.get('/user-housing-departments', function (req, res) {
  res.sendfile('public/userHousingDepartmentsOverview.html')
})

app.get('/admin-housing-departments', function (req, res) {
  res.sendfile('public/adminsHousingDepartments.html')
})

app.get('/admin-housing-departments-json', function (req, res) {
  connection.query(`SELECT *
FROM waiting_list.housing_departments
INNER JOIN waiting_list.housing_department_admins
ON waiting_list.housing_departments.id = waiting_list.housing_department_admins.department_id
WHERE waiting_list.housing_department_admins.admin_id = ` + req.session.userId + ';', (error, results, fields) => {
    res.send(results)
    res.end()
  })
})

app.get('/housing-departments-json', function (req, res) {
  connection.query('SELECT * FROM waiting_list.housing_departments ;', (error, results, fields) => {
    res.send(results)
    res.end()
  })
})

app.get('/user-housing-departments-json', function (req, res) {
  connection.query('SELECT * FROM waiting_list.waiting_list WHERE user_id = ' + req.session.userId + ';', (error, waitingList, fields) => {
    res.send(waitingList)
    res.end()
  })
})

app.get('/housing-department-json', function (req, res) {
  connection.query('SELECT * FROM waiting_list.housing_departments WHERE id = ? ;', [req.query.id], (error, results, fields) => {
    res.send(results)
    res.end()
  })
})

app.get('/new-housing-department', function (req, res) {
  // Authenticate
  //  if (!authentication.authenticate(req, res, "/login")){return;}
  res.sendfile('public/newHousingDepartment.html')
})

app.post('/new-housing-department', function (req, res) {
  // Authenticate
  if (!authentication.authenticate(req, res, '/login')) {
    return
  }

  connection.query('INSERT INTO waiting_list.housing_departments (name, address, description, fee, available) VALUES (?,?,?,?,?)',
    [req.body.name, req.body.address, req.body.description, req.body.fee, req.body.available], function (err, result, fields) {
      if (err) throw err
      connection.query('INSERT INTO waiting_list.housing_department_admins (department_id, admin_id) VALUES (?,?)', [result.insertId, req.session.userId])
    })
  res.sendfile('public/newHousingDepartment.html')
})

app.get('/login', function (req, res) {
  res.sendfile('public/login.html')
})

app.post('/login', function (req, res) {
  console.log(req.body)
  authentication.logIn(req, res, connection, '/users')
})

app.get('/register', function (req, res) {
  res.sendfile('public/register.html')
})

app.post('/register', function (req, res) {
  authentication.createAccount(req, res, connection, '/users')
})

app.post('/sign-up', function (req, res) {
  console.log(req.body.housingDepartmentId)
  connection.query('INSERT INTO waiting_list.waiting_list ( housing_department_id, user_id) VALUES (?,?)',
    [req.body.housingDepartmentId, req.session.userId], function (err, result, fields) {
      if (err) throw err
    })
})

connection.connect()

module.exports = app
