var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const session = require("express-session");
const authentication = require("./util/authentication.js");


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var loginRouter = require('./routes/login');
var registerRouter = require('./routes/register');


const mysql = require("mysql");


var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded());


app.use(
    session({
        secret: "sessionSecret",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    })
);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/login', loginRouter);
//app.use('/register', registerRouter);



const connection = mysql.createConnection({
    host: "database-2.cqhj7tyf9brs.us-east-1.rds.amazonaws.com",
    user: "admin",
    port: "3306",
    password: "",
    database: "waiting_list"
});


app.get('/housing-department', function (req, res) {
    res.sendfile('public/housingDepartmentInfo.html')
})

app.get('/housing-departments', function (req, res) {
    res.sendfile('public/housingDepartmentsOverview.html')
})

app.get('/housing-departments-json', function (req, res) {
    connection.query(`SELECT * FROM waiting_list.housing_departments ;`, (error, results, fields) => {
    res.send(results);
    res.end();
    })
})

app.get('/housing-department-json', function (req, res) {
    connection.query(`SELECT * FROM waiting_list.housing_departments WHERE id = ? ;`, [req.query.id], (error, results, fields) => {
        res.send(results);
        res.end();
    })
})

app.get('/new-housing-department', function (req, res) {
    // Authenticate
    if (!authentication.authenticate(req, res, "/login")){return;}
    res.sendfile('public/newHousingDepartment.html')
})

app.post('/new-housing-department', function (req, res) {
    // Authenticate
    if (!authentication.authenticate(req, res, "/login")){return;}

    connection.query('INSERT INTO waiting_list.housing_departments (name, address, description, fee, available) VALUES (?,?,?,?,?)',
        [req.body.name, req.body.address, req.body.description, req.body.fee, req.body.available], function(err, result, fields) {
        if (err) throw err;
            connection.query("INSERT INTO waiting_list.housing_department_admins (department_id, admin_id) VALUES (?,?)", [result.insertId, req.session.userId]);
    });
        res.sendfile('public/newHousingDepartment.html')
})

app.get('/login', function (req, res) {
    res.sendfile('public/login.html')
})

app.post('/login', function (req, res) {
    authentication.logIn(req, res, connection, "/users")
})

app.get('/register', function (req, res) {
    res.sendfile('public/register.html')
})

app.post('/register', function (req, res) {
    authentication.createAccount(req,res,connection, "/users");
})



connection.connect()





module.exports = app;
