const { Kafka } = require("kafkajs");
const MongoClient = require("mongodb").MongoClient;
const crypto = require("crypto");

const BOOTSTRAP_KAFKA_HOST = process.env.BOOTSTRAP_KAFKA_HOST;
const MONGO_URL = process.env.MONGO_URL;
const MONGO_DBNAME = process.env.MONGO_DBNAME || "datahub";

const CONTEXT_DATA_TOPIC = ".context_data";
const TENANT_CONTEXT_DATA_TOPIC = ".tenant_context_data";

const kafka = new Kafka({
    clientId: "policy-generator",
    brokers: [BOOTSTRAP_KAFKA_HOST],
});

let tenant_context = {};

let context_data = {};

let context_hash = {};

let context_mapping = {};

const producer = kafka.producer();
producer.connect();

async function subscribe_contexts() {
    const consumer = kafka.consumer({
        groupId: "Context-Interpretation-Worker-group",
    });
    await consumer.connect();

    consumer.subscribe({ topic: CONTEXT_DATA_TOPIC, fromBeginning: true });

    consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const updated_data = JSON.parse(message.value.toString());

            process_context_data(updated_data);
        },
    });
}

function fetch_db() {
    MongoClient.connect(MONGO_URL, function (err, db) {
        if (err) throw err;
        var dbo = db.db(MONGO_DBNAME);

        dbo.collection("policies")
            .find({})
            .toArray(function (err, result) {
                if (err) throw err;
                result.forEach((element) => {
                    tenant_id = element["tenant_name"];
                    policies = element["policies"];

                    tenant_context[tenant_id] = [];

                    for (let i = 0; i < policies.length; i++) {
                        tenant_context[tenant_id].push({
                            Condition: policies[i]["Condition"],
                        });
                    }
                });
            });

        // changeStream = dbo.collection("policies").watch();

        // changeStream.on("change",function(change){
        //   documentKey = change['documentKey']['_id'];

        //   dbo.collection("policies").findOne({"_id": new ObjectId(documentKey)}, function(err, doc) {
        //     if(doc!=undefined){

        //       tenant_id = doc['tenant_name']
        //       policies = doc['policies']
        //       tenant_context[tenant_id] = []

        //       for(let i=0;i<policies.length;i++){

        //         tenant_context[tenant_id].push({
        //           "Condition":  policies[i]['Condition'],
        //           'last_validated': false
        //         })
        //       }
        //     }
        //   });
        // });
    });
}

function process_context_data(updated_data) {
    // console.log(`context_data: ${JSON.stringify(context_data)}`);
    context_data = Object.assign(context_data, updated_data);
    console.log(`updated_data: ${JSON.stringify(updated_data, null, 4)}`);
    console.log(
        `merged context_data: ${JSON.stringify(context_data, null, 4)}`
    );
    console.log(`tenant_context: ${JSON.stringify(tenant_context, null, 4)}`);
    evaluate_tenant_contexts();
}

function evaluate_tenant_contexts() {
    console.log("--------------------");

    // const ts = Date.now();
    // console.log(
    //     `Context Change, Timestamp: ${ts},
    //     tenantcontext: ${JSON.stringify(tenant_context, null, 4)},
    //     context: ${JSON.stringify(updated_context, null, 4)}`
    // );

    Object.keys(tenant_context).forEach(function (tenant_id) {
        evaluate_tenant_context(tenant_id);
    });
}

function peopleCountEvaluationChanged(
    tenant_context_data,
    tenant_context,
    tenant_id,
    condition_detail,
    context_data,
    att_idx,
    group_idx,
    condition_idx
) {
    if (!tenant_context_data["people_count"]) {
        tenant_context_data["people_count"] = {};
    }
    tenant_context_data["people_count"][condition_detail["location"]] =
        context_data["people_count"][condition_detail["location"]];

    //Evaluate if we should push
    const evaluation_status = evaluate_value(
        condition_detail,
        context_data["people_count"][condition_detail["location"]]
    );
    const previous_evaluation_status =
        tenant_context[tenant_id][condition_idx]["Condition"][group_idx][
            att_idx
        ]["evaluation_status"];
    //Set to the value

    tenant_context[tenant_id][condition_idx]["Condition"][group_idx][att_idx][
        "evaluation_status"
    ] = evaluation_status;

    return previous_evaluation_status != evaluation_status;
}

function dataAmountEvaluationChanged(
    tenant_context_data,
    tenant_context,
    tenant_id,
    condition_detail,
    context_data,
    att_idx,
    group_idx,
    condition_idx
) {
    if (!tenant_context_data["data_amount"]) {
        tenant_context_data["data_amount"] = {};
    }

    console.log("DEBUG----------------------------");
    // console.log(`tenant_context_data: ${JSON.stringify(tenant_context_data)}`);
    // console.log(`tenant_context: ${JSON.stringify(tenant_context)}`);
    // console.log(`tenant_id: ${tenant_id}`);
    // console.log(`condition_detail: ${JSON.stringify(condition_detail)}`);
    // console.log(`context_data: ${JSON.stringify(context_data)}`);
    console.log(
        `context_data["data_amount"][${tenant_id}]: ${JSON.stringify(
            context_data["data_amount"][tenant_id]
        )}`
    );
    console.log("DEBUG-END----------------------------");
    if (!(tenant_id in context_data["data_amount"])) {
        return;
    }

    tenant_context_data["data_amount"][condition_detail["protocol"]] =
        context_data["data_amount"][tenant_id][condition_detail["protocol"]];
    console.log(
        `tenant_context_data["data_amount"][condition_detail["protocol"]]: ${JSON.stringify(
            tenant_context_data["data_amount"][condition_detail["protocol"]]
        )}`
    );
    //Evaluate if we should push
    const evaluation_status = evaluate_value(
        condition_detail,
        context_data["data_amount"][tenant_id][condition_detail["protocol"]]
    );
    const previous_evaluation_status =
        tenant_context[tenant_id][condition_idx]["Condition"][group_idx][
            att_idx
        ]["evaluation_status"];
    //Set to the value
    tenant_context[tenant_id][condition_idx]["Condition"][group_idx][att_idx][
        "evaluation_status"
    ] = evaluation_status;

    return previous_evaluation_status != evaluation_status;
}

function evaluate_tenant_context(tenant_id) {
    //By default, we don't push context. We will check if the context changes
    let push_context = false;
    const tenant_context_data = {};

    Object.keys(tenant_context[tenant_id]).forEach(function (policy_idx) {
        const condition = tenant_context[tenant_id][policy_idx];
        if (!condition["Condition"]) {
            return;
        }

        //Loop: Anyof, All
        let conditionGroups = condition["Condition"];
        Object.keys(conditionGroups).forEach(function (group_idx) {
            let predicates = conditionGroups[group_idx];
            Object.keys(predicates).forEach(function (predicate_idx) {
                const condition_detail = predicates[predicate_idx];
                const condition_detail_key = condition_detail["object"];

                if (!(condition_detail_key in context_data)) {
                    return;
                }

                if (condition_detail_key === "people_count") {
                    try {
                        if (
                            peopleCountEvaluationChanged(
                                tenant_context_data,
                                tenant_context,
                                tenant_id,
                                condition_detail,
                                context_data,
                                predicate_idx,
                                group_idx,
                                policy_idx
                            )
                        ) {
                            push_context = true;
                        }
                    } catch (e) {
                        console.error(
                            `Error when evaluating people count change: ${e}`
                        );
                        tenant_context_data["people_count"][
                            condition_detail["location"]
                        ] = 0;
                    }
                } else if (condition_detail_key === "data_amount") {
                    try {
                        if (
                            dataAmountEvaluationChanged(
                                tenant_context_data,
                                tenant_context,
                                tenant_id,
                                condition_detail,
                                context_data,
                                predicate_idx,
                                group_idx,
                                policy_idx
                            )
                        ) {
                            push_context = true;
                        }
                    } catch (e) {
                        console.error(
                            `Error when evaluating data amount change: ${e}`
                        );
                        tenant_context_data["data_amount"][
                            condition_detail["protocol"]
                        ] = 0;
                    }
                } else {
                    console.error(
                        `Unhandled condition_detail_key encountered: ${condition_detail_key}`
                    );
                }
            });
        });
    });

    if (push_context || true) {
        const ts = Date.now();
        console.log(
            `[${tenant_id}], PUSH Context Change: ${JSON.stringify(
                tenant_context_data
            )}`
        );

        const tenant_context_to_push = {
            context_data: JSON.stringify(tenant_context_data),
            tenant_id: tenant_id,
        };

        producer.send({
            topic: TENANT_CONTEXT_DATA_TOPIC,
            messages: [
                {
                    value: JSON.stringify(tenant_context_to_push),
                },
            ],
        });
    }
}

function evaluate_value(condition, updated_values) {
    let return_status = 0;

    for (const [key, value] of Object.entries(updated_values)) {
        const condition_comparison = condition[key];
        if (!condition_comparison) {
            continue;
        }

        for (const [operator, threshold] of Object.entries(
            condition_comparison
        )) {
            if (operator == "gt" && value > threshold) {
                return_status = 1;
            } else if (operator == "gte" && value >= threshold) {
                return_status = 1;
            } else if (operator == "le" && value < threshold) {
                return_status = 1;
            } else if (operator == "lte" && value < threshold) {
                return_status = 1;
            } else {
                return_status = -1;
            }
        }
    }

    return return_status;
}

function publish_tenant_context(tenant_id, tenant_context_conditions) {
    const tenant_context_data = {};

    Object.keys(tenant_context_conditions).forEach(function (condition_idx) {
        const condition = tenant_context_conditions[condition_idx];
        if (condition["Condition"] != undefined) {
            //Loop: Anyof, All
            Object.keys(condition["Condition"]).forEach(function (group_idx) {
                Object.keys(condition["Condition"][group_idx]).forEach(
                    function (att_idx) {
                        const condition_detail =
                            condition["Condition"][group_idx][att_idx];
                        if (condition_detail["object"] == "people_count") {
                            if (
                                tenant_context_data["people_count"] == undefined
                            ) {
                                tenant_context_data["people_count"] = {};
                            }
                            try {
                                tenant_context_data["people_count"][
                                    condition_detail["location"]
                                ] =
                                    context_data["people_count"][
                                        condition_detail["location"]
                                    ];
                            } catch (e) {
                                tenant_context_data["people_count"][
                                    condition_detail["location"]
                                ] = 0;
                            }
                        }

                        if (condition_detail["object"] == "data_amount") {
                            if (
                                tenant_context_data["data_amount"] == undefined
                            ) {
                                tenant_context_data["data_amount"] = {};
                            }
                            try {
                                tenant_context_data["data_amount"][
                                    condition_detail["protocol"]
                                ] =
                                    context_data["data_amount"][tenant_id][
                                        condition_detail["protocol"]
                                    ];
                            } catch (e) {
                                tenant_context_data["data_amount"][
                                    condition_detail["protocol"]
                                ] = 0;
                            }
                        }
                    }
                );
            });
        }
    });

    data_json = JSON.stringify(tenant_context_data);

    data_json_md5 = crypto.createHash("md5").update(data_json).digest("hex");

    if (context_hash[tenant_id] != data_json_md5) {
        const ts = Date.now();
        console.log(`[${tenant_id}], Context Change TS: ${ts}`);

        console.log(data_json_md5);

        context_hash[tenant_id] = data_json_md5;

        const tenant_context = {
            context_data: JSON.stringify(tenant_context_data),
            tenant_id: tenant_id,
        };

        producer.send({
            topic: TENANT_CONTEXT_DATA_TOPIC,
            messages: [
                {
                    value: JSON.stringify(tenant_context),
                },
            ],
        });
    }
}

subscribe_contexts();
fetch_db();

// setInterval(() => {

//   Object.keys(tenant_context).forEach(function(tenant_id) {

//     publish_tenant_context(tenant_id,tenant_context[tenant_id])

//   });

// }, 1000);
