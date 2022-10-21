var mqtt = require("mqtt");
var client = mqtt.connect("mqtt://virtual-mqtt:1883", {
    username: "tenant-2",
    password: "123456",
});

client.on("connect", function () {
    console.log("MQTT connected");

    const ts = Date.now();
    console.log(`Publish the data starts at: ${ts}`);

    for (let i = 0; i < 1000; i++) {
        client.publish(
            "/smartcity/camera/people_count/usa/ohio/store_x/city_ai",
            "This is a very long string to test the MQTT Server"
        );
    }

    client.end();
});