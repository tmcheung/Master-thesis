var mqtt = require("mqtt");
var client = mqtt.connect("mqtt://virtual-mqtt:1883", {
    username: "context_sensing",
    password: "123456",
});

client.on("connect", function () {
    console.log("MQTT connected");

    client.subscribe(
        "/smartcity/camera/people_count/usa/ohio/store_x/city_ai",
        function (err) {
            console.log(err);
        }
    );
});

let count = 0;
client.on("message", function (topic, message) {
    // message is Buffer
    // console.log(message.toString())
    count = count + 1;
    // console.log(count);
    if (count % 1000 == 0) {
        const ts = Date.now();
        console.log(`Subscribe the data ends at: ${ts}`);
    }
});
