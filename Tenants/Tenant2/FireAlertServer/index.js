const express = require("express");
const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json({ type: "*/*" }));

let a = "";

app.get("/", (req, res) => {
    text = `
        <script>
        setInterval(() => {
            location.reload()
        }, 3000);   
        </script>
        <div>
            Status:
            ${a}
        </div>
    `;
    res.send(text);
});

let count = 0;
app.put("/people_count", function (req, res) {
    count += 1;
    console.log(`Received: ${Date.now()}`, req.body.msg);

    // a = req.body.msg;
    res.status(200).send();
});

app.listen(PORT, () => {
    console.log(`Example app listening at http://localhost:${PORT}`);
});
