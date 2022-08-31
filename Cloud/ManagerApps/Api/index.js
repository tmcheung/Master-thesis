const express = require("express");
const bcrypt = require("bcryptjs");
const MongoClient = require("mongodb").MongoClient;

const PORT = process.env.PORT || 3000;
const MONGO_URL =
    process.env.MONGO_URL || "mongodb://root:password123@192.168.1.156";
const MONGO_DBNAME = process.env.MONGO_DBNAME || "datahub";
const app = express();

app.use(express.json({ type: "*/*" }));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/mapping", (req, res) => {
    MongoClient.connect(
        MONGO_URL,
        { useUnifiedTopology: true },
        function (err, db) {
            if (err) throw err;
            var dbo = db.db(MONGO_DBNAME);

            dbo.collection("contexts")
                .find({})
                .toArray(function (err, result) {
                    if (err) throw err;

                    db.close();

                    res.send(JSON.stringify(result[0]));
                });
        }
    );
});

app.post("/login", function (req, res) {

    console.log("stringified header: " + JSON.stringify(req.headers))
    console.log("stringified ip: " + JSON.stringify(req.ip))
    console.log("stringified hostname: " + JSON.stringify(req.hostname))
    console.log("stringified body: " + JSON.stringify(req.body))
    let username = req.body["username"];
    let password = req.body["password"];

    console.log(`credentials: ${username}, ${password}`)
    MongoClient.connect(
        MONGO_URL,
        { useUnifiedTopology: true },
        function (err, db) {
            if (err) throw err;
            var dbo = db.db(MONGO_DBNAME);

            dbo.collection("tenants").findOne(
                { tenant_name: username },
                function (err, result) {
                    if (err) throw err;
                    db.close();

                    let status = false;

                    if (
                        result != null &&
                        bcrypt.compareSync(password, result.password)
                    ) {
                        status = true;
                    }
                    if(result != null) console.log(`passwords: ${password}, ${result.password}`)
                    else console.log(`RESULT NULL`)
                    
                    console.log("status: " + status)
                    console.log(`_________________________________________`)

                    response_body = {
                        status: status,
                    };

                    res.send(JSON.stringify(response_body));
                }
            );
        }
    );
});

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});
