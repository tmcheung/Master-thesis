const express = require("express");
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json({ type: "*/*" }));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.put("/people_count", function (req, res) {
    console.log("stringified header: " + JSON.stringify(req.headers));
    console.log("stringified ip: " + JSON.stringify(req.ip));
    console.log("stringified hostname: " + JSON.stringify(req.hostname));
    console.log("stringified body: " + JSON.stringify(req.body));

    res.status(200).send();
});

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});
