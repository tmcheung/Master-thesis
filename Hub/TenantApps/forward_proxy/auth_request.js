const authorizeRequest = async (r) => {
    const credentials = getBasicAuthCredentials(r);
    const method = getMethod(r);
    const url = getUrl(r);

    if (
        !credentials ||
        !(await authenticated(r, credentials.username, credentials.password))
    ) {
        r.return(401);
        return;
    }

    if (await authorized(r, credentials.username, method, url)) {
        r.return(200);
    } else {
        r.return(403);
    }
};

const authenticated = async (r, username, password) => {
    const response = await r.subrequest("/_authenticate", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });
    const json = JSON.parse(response.responseText);
    return json && json.status;
};

const authorized = async (r, username, method, url) => {
    r.error(`/opa_${username}`);
    const response = await r.subrequest(`/opa_${username}`, {
        method: "POST",
        body: JSON.stringify({
            input: {
                tenant_id: username,
                action: method,
                topic: url,
            },
        }),
    });
    const json = JSON.parse(response.responseText);
    return json && json.result && json.result.allow;
};

const getMethod = (r) => r.variables.request_method;
const getUrl = (r) =>
    r.variables.scheme +
    "://" +
    r.variables.host +
    r.variables.request_uri.split("?")[0];

const getBasicAuthCredentials = (r) => {
    if (
        !r.headersIn["Proxy-Authorization"] &&
        r.headersIn["Proxy-Authenticate"] !== "Basic"
    ) {
        return null;
    }

    const credentials = r.headersIn["Proxy-Authorization"].split(":");
    if (credentials.length !== 2) {
        return null;
    }

    return {
        username: credentials[0],
        password: credentials[1],
    };
};

export default { authorizeRequest };
