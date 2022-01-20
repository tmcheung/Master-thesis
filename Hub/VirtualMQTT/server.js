const aedes = require("aedes")();
const mqtt = require("mqtt");

const { createServer } = require("aedes-server-factory");
const sizeof = require("sizeof");

const urljoin = require("url-join");
const port = 1883;

//Configure MQTT over WS
const httpServer = require("http").createServer();
const ws = require("websocket-stream");
const http_port = 8888;
ws.createServer({ server: httpServer }, aedes.handle);

//Configure MQTT
const server = createServer(aedes);

const fetch = require("node-fetch");

const AUTHENTICATION_HOST = process.env.AUTHENTICATION_HOST;
const AUTHENTICATION_URL = urljoin(AUTHENTICATION_HOST, "/login");
const { authorize, authorizationExpired } = require("./auth");

const DATA_AMOUNT_TOPIC = "/hub/data_amount/mqtt";
const data_amount = {};

var mqtt_client = mqtt.connect("mqtt://localhost", {
    username: "mqtt_system",
    password: "123456",
});

function removeTopicWildcard(topic) {
    return topic.replace("#", "99999999999999999999999999999999999");
}

aedes.authenticate = function (client, username, password, callback) {
    if (username == undefined || password == undefined) {
        callback(null, true);
        return;
    }

    client.username = username;
    client.password = password.toString();

    login_body = {
        username: client.username,
        password: client.password,
    };

    fetch(AUTHENTICATION_URL, {
        method: "POST",
        body: JSON.stringify(login_body),
    })
        .then((res) => res.json()) // expecting a json response
        .then((json) => {
            if (json["status"]) {
                console.log("User %s is authenticated", username);
                if (!(username in data_amount)) {
                    data_amount[username] = 0;
                }

                callback(null, true);
            } else {
                console.log("User %s is NOT authenticated", username);

                var error = new Error("Auth error");
                error.returnCode = 4;
                callback(error, null);
            }
        });
};

aedes.authorizePublish = function (client, packet, callback) {
    const user = client.username;
    const topic = packet.topic;
    const action = `publish`;

    if (!authorizationExpired(client, topic, action, 10000)) {
        data_amount[user] = data_amount[user] + sizeof.sizeof(packet);
        console.log(`client ${user} is authorized to publish to ${topic}`);
        callback(null);
        return;
    }

    authorize(client, topic, action).then((isAuthorized) => {
        if (isAuthorized) {
            data_amount[user] = data_amount[user] + sizeof.sizeof(packet);
            console.log(`client ${user} is authorized to publish to ${topic}`);
            callback(null);
        } else {
            console.log(
                "Tenant %s is not authorized to publish to %s",
                user,
                topic
            );
            callback(new Error("Unauthorized"));
        }
    });
};

aedes.authorizeSubscribe = function (client, sub, callback) {
    const topic = removeTopicWildcard(sub.topic);
    const action = `subscribe`;

    if (!authorizationExpired(client, topic, action, 30000)) {
        console.log("Tenant %s subscribed to %s", client.username, sub.topic);
        callback(null, sub);
        return;
    }

    authorize(client, topic, action).then((isAuthorized) => {
        if (isAuthorized) {
            console.log(
                "Tenant %s subscribed to %s",
                client.username,
                sub.topic
            );
            callback(null, sub);
        } else {
            console.log(
                "Tenant %s is not authorized to subscribe to %s",
                client.username,
                sub.topic
            );
            callback(new Error("Unauthorized"));
        }
    });
};

aedes.authorizeForward = function (client, packet) {
    const username = client.username;
    const topic = removeTopicWildcard(packet.topic);
    const action = `subscribe`;

    if (authorizationExpired(client, topic, action, 10000)) {
        authorize(client, topic, action);
    }

    if (authorizationExpired(client, topic, action, 30000)) {
        console.log(
            `Client ${username} is not authorized to receive packet ${JSON.stringify(
                packet
            )}`
        );
        return null;
    } else {
        data_amount[username] = data_amount[username] + sizeof.sizeof(packet);
        console.log(
            `Forwarding packet ${JSON.stringify(packet)} to client ${username} `
        );
        return packet;
    }
};

server.listen(port, function () {
    console.log("server started and listening on port ", port);
});

httpServer.listen(http_port, function () {
    console.log("websocket server listening on port ", http_port);
});

setInterval(() => {
    for (const [tenant_id, value] of Object.entries(data_amount)) {
        const topic = `${DATA_AMOUNT_TOPIC}/${tenant_id}`;

        console.log(
            `Publishing: ${data_amount[tenant_id]}, on topic: ${topic}`
        );

        aedes.publish({
            cmd: "publish",
            qos: 2,
            topic: topic,
            payload: Buffer.from(`${data_amount[tenant_id]}`),
            retain: false,
        });
        mqtt_client.publish(topic, `${data_amount[tenant_id]}`);

        data_amount[tenant_id] = 0;
    }
}, 6000);
