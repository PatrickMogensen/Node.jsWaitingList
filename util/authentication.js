const bcrypt = require("bcrypt");
const saltRounds = 12;

function createAccount(req, res, connection, successRedirect) {
    connection.query(`SELECT * FROM waiting_list.users WHERE email = ?;`, [req.body.email], (error, results, fields) => {
        if (results.length === 0) {
            if (req.body.password === req.body.passwordRepeat) {
                bcrypt.hash(req.body.password, saltRounds, (error, hash) => {
                    connection.query("INSERT INTO waiting_list.users (email, password) VALUES (?,?)", [req.body.email, hash]);
                    res.redirect(successRedirect);
                });
            }
        } else {

            // skal håndteres
            res.send("Email-adressen er alllerede i brug");
        }
    });
}

function logIn(req, res,connection, successRedirect) {
    connection.query(`SELECT * FROM waiting_list.users WHERE email = ?;`, [req.body.email], (error, results, fields) => {
        bcrypt.compare(req.body.password, results[0].password, (error, result) => {
            console.log(result);
            if (result === true) {
                var sessionData = req.session;
                sessionData.userId = results[0].id;
                sessionData.email = req.body.email;
                console.log(sessionData.email);
                res.redirect(successRedirect);
                res.end();
            } else {
                res.redirect("/login");
            }
        });
    });
}

function authenticate(req, res, failureRedirect) {
   // console.log(req.session.email);
    if (req.session.email == undefined) {
        // tilføj fejlmeddelelse

        res.redirect(failureRedirect);
        return false;
    } else {
        console.log(" du er logget ind");
        return true;
    }
}

function logout(req, res) {
    req.session.destroy();
    res.redirect("/login");
}




module.exports.createAccount = createAccount;
module.exports.logIn = logIn;
module.exports.logout = logout;
module.exports.authenticate = authenticate;
