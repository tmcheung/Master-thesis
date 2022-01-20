const urljoin = require("url-join");
const fetch = require("node-fetch");

const OPA_HOST = process.env.OPA_HOST;
const OPA_URL = urljoin(OPA_HOST, "v1/data/app/iot");

function updateTimeAuthorized(client, topic, action, datetime) {
    if (!client.authorize_subscribe) {
        client.authorize_subscribe = {};
    }
    if (!client.authorize_publish) {
        client.authorize_publish = {};
    }

    if (action === `subscribe`) {
        client.authorize_subscribe[topic] = datetime;
    } else if (action === `publish`) {
        client.authorize_publish[topic] = datetime;
    }
}

function authorizationExpired(client, topic, action, expirationThreshold) {
    if (!client.authorize_subscribe) {
        client.authorize_subscribe = {};
    }
    if (!client.authorize_publish) {
        client.authorize_publish = {};
    }

    const now = Date.now();
    if (action === `subscribe`) {
        return now - client.authorize_subscribe[topic] > expirationThreshold;
    } else if (action === `publish`) {
        return now - client.authorize_publish[topic] > expirationThreshold;
    }
}

async function authorize(client, topic, action) {
    if (authorizationNotExpired(client, topic, action, 10000)) {
        return true;
    }

    const user = client.username;
    opa_body = {
        input: {
            action: action,
            tenant_id: user,
            topic: topic,
        },
    };

    const opa_tenant_url = OPA_URL.replace("opa", `opa_${user}`);
    const authorized = await fetch(opa_tenant_url, {
        method: "POST",
        body: JSON.stringify(opa_body),
    })
        .then((res) => res.json())
        .then((json) => {
            return json["result"]["allow"] ? true : false;
        });

    if (authorized) {
        updateTimeAuthorized(client, topic, action, Date.now());
    }

    return authorized;
}

module.exports = {
    authorize,
    authorizationExpired,
};
