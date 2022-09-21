var mqtt = require("mqtt");
const { Kafka } = require("kafkajs");
const { DataFrame } = require("dataframe-js");
const fetch = require("node-fetch");
const urljoin = require("url-join");

const MQTT_HOST = process.env.MQTT_HOST;
const BOOTSTRAP_KAFKA_HOST = process.env.BOOTSTRAP_KAFKA_HOST;
const API = process.env.API;

const API_MAPPING_URL = urljoin(API, "/mapping");

const kafka_context_sensing_topic = ".context_data";

var client = mqtt.connect(MQTT_HOST, {
    username: "context_sensing",
    password: "123456",
});

const kafka = new Kafka({
    clientId: "context-sensing",
    brokers: [BOOTSTRAP_KAFKA_HOST],
});

const producer = kafka.producer();
producer.connect();

mapping = {};

data = {};

// Context Sensing
client.on("connect", () => {
    console.log("MQTT connected");

    fetch(API_MAPPING_URL, { method: "GET" })
        .then((res) => res.json()) // expecting a json response
        .then((json) => {
            mapping = json;
            for (const [type, sub] of Object.entries(mapping)) {
                if (type != "_id") {
                    for (const [sub1, conf] of Object.entries(mapping[type])) {
                        const topic = conf["topic"];
                        client.subscribe(topic, null, function (err, granted) {
                            if (err) {
                                console.log(
                                    `Error when subscribing to ${topic}: ${JSON.stringify(
                                        err
                                    )}`
                                );
                            } else {
                                console.log(
                                    `Succesfully subscribing to ${topic}: ${JSON.stringify(
                                        granted
                                    )}`
                                );
                            }
                        });
                    }
                }
            }
        });

    // const test_topic = `/hub/data_amount/mqtt/mqtt_system`;
    // client.subscribe(test_topic, function (err, granted) {
    //     if (err) {
    //         console.log(
    //             `Error when subscribing to ${test_topic}: ${JSON.stringify(
    //                 err
    //             )}`
    //         );
    //     } else {
    //         console.log(
    //             `Succesfully subscribing to ${test_topic}: ${JSON.stringify(
    //                 granted
    //             )}`
    //         );
    //     }
    // });
});

client.on("message", function (topic, message) {
    // message is Buffer
    console.log(`Received message: ${message.toString()}, on topic: ${topic}`);

    if (!(topic in data)) {
        const df = new DataFrame([], ["Timestamp", "data"]);
        data[topic] = df;
    }

    data[topic] = data[topic].push([Date.now(), message.toString()]);
});

function process_people_count() {
    console.log("process_people_count");

    for (const [location, value] of Object.entries(mapping["people_count"])) {
        const topic = value["topic"];

        if (!(topic in data)) {
            continue;
        }

        const last_5mins = Date.now() - 5 * 60 * 1000;
        const last_15mins = Date.now() - 15 * 60 * 1000;

        context_data = {
            people_count: {},
        };

        let offsetData5Min = data[topic].filter(
            (row) => row.get("Timestamp") > last_5mins
        );
        let offsetData15Min = data[topic].filter(
            (row) => row.get("Timestamp") > last_15mins
        );

        context_data["people_count"][location] = {
            max_5mins: offsetData5Min.stat.max("data"),
            min_5mins: offsetData5Min.stat.min("data"),
            avg_5mins: offsetData5Min.stat.mean("data"),
            max_15mins: offsetData15Min.stat.max("data"),
            min_15mins: offsetData15Min.stat.min("data"),
            avg_15mins: offsetData15Min.stat.mean("data"),
        };

        console.log(JSON.stringify(context_data, null, 4));

        producer.send({
            topic: kafka_context_sensing_topic,
            messages: [{ value: JSON.stringify(context_data) }],
        });
    }
}

function process_fire_detected() {
    console.log("process_fire_detected");

    for (const [location, value] of Object.entries(mapping["fire_detected"])) {
        const topic = value["topic"];

        if (!(topic in data)) {
            continue;
        }

        const last_5mins = Date.now() - 5 * 60 * 1000;
        const last_15mins = Date.now() - 15 * 60 * 1000;

        context_data = {
            fire_detected: {},
        };

        let offsetData5Min = data[topic].filter(
            (row) => row.get("Timestamp") > last_5mins
        );
        let offsetData15Min = data[topic].filter(
            (row) => row.get("Timestamp") > last_15mins
        );

        context_data["fire_detected"][location] = {
            max_5mins: offsetData5Min.stat.max("data"),
            min_5mins: offsetData5Min.stat.min("data"),
            avg_5mins: offsetData5Min.stat.mean("data"),
            max_15mins: offsetData15Min.stat.max("data"),
            min_15mins: offsetData15Min.stat.min("data"),
            avg_15mins: offsetData15Min.stat.mean("data"),
        };

        console.log(JSON.stringify(context_data, null, 4));

        producer.send({
            topic: kafka_context_sensing_topic,
            messages: [{ value: JSON.stringify(context_data) }],
        });
    }
}

function process_data_amount() {
    // console.log(`process_data_amount: ${JSON.stringify(data, null, 4)}`);
    console.log(`process_data_amount`);

    const last_hour = Date.now() - 60 * 60 * 1000;
    const last_24hour = Date.now() - 24 * 60 * 60 * 1000;

    context_data = {
        data_amount: {},
    };

    for (const [topic, value] of Object.entries(data)) {
        if (topic.startsWith("/hub/data_amount")) {
            topic_parts = topic.split("/");

            protocol = topic_parts[3];
            tenant = topic_parts[4];

            context_data["data_amount"][tenant] = {};
            context_data["data_amount"][tenant][protocol] = {
                lasthour_mb:
                    value
                        .filter((row) => row.get("Timestamp") > last_hour)
                        .stat.sum("data") / 1000000,
                last24hour_mb:
                    value
                        .filter((row) => row.get("Timestamp") > last_24hour)
                        .stat.sum("data") / 1000000,
            };
        }
    }

    console.log(JSON.stringify(context_data, null, 4));
    producer.send({
        topic: kafka_context_sensing_topic,
        messages: [{ value: JSON.stringify(context_data) }],
    });

    // for (const [protocol, value] of Object.entries(mapping['data_amount'])) {
    //     const topic = value['topic']

    //     console.log(topic)

    //     // if (data[topic] == undefined) {
    //     //     continue
    //     // }

    //     topic_parts = topic.split("/")
    //     tenant = topic_parts[topic_parts.length-1]

    //     const last_hour = Date.now() - 60*60*1000
    //     const last_24hour = Date.now() - 24*60*60*1000

    //     context_data = {
    //         'data_amount': {

    //         }
    //     }

    //     context_data['data_amount'][tenant] = {}
    //     context_data['data_amount'][tenant][protocol] = {
    //         "lasthour_mb": data[topic].filter(row => row.get('Timestamp') > last_hour).stat.sum("data")/1000000,
    //         "last24hour_mb": data[topic].filter(row => row.get('Timestamp') > last_24hour).stat.sum("data")/1000000
    //     }

    //     console.log(context_data)

    //     producer.send({
    //     topic: kafka_context_sensing_topic,
    //     messages: [
    //         { value: JSON.stringify(context_data) },
    //         ],
    //     })

    // }
}

setInterval(function () {
    try {
        process_people_count();
    } catch (err) {
        console.error(
            `exception thrown when attempting to process people count: ${err}`
        );
    }

    try {
        process_fire_detected();
    } catch (err) {
        console.error(
            `exception thrown when attempting to process fire_detected: ${err}`
        );
    }

    try {
        process_data_amount();
    } catch (err) {
        console.error(
            `exception thrown when attempting to process data amount: ${err}`
        );
    }
}, 5000);
