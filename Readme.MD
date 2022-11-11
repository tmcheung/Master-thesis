# CONTEXT-BASED MULTI-TENANCY POLICY ENFORCEMENT FOR DATA SHARING IN IOT SYSTEMS

## Introduction

This Github repository includes the code and infrastructure set up for the IoT Datahub with tenant application delpoyment.
This project has been implemented by Huu Ha Nguyen and Thomas Man-Gang Cheung with the instruction and supervisor from Professor Hong-Linh Truong, Professor Phu. Phung, Dr. Phu Nguyen.

## System Architecture

### Version 1

The platform is proposed to be a multi-regional-hubs system that connects with the Cloud for data exchange. The hubs serve the clients in its region and based on the data collected, it aggregates the corresponding data to become contexts and sends them to the Cloud. The cloud receives that context data to process and sends management commands to the hubs.

![Alt text](/readme/img/cloud-hubs-architecture.png?raw=true "Multiple region architecture")

Considering the connection between a specific hub with the cloud, there are several services are set up tied to 2 types:
Cloud services: The services that runs on the cloud for management including MongoDB, Kafka, Context-based interpretation worker, Local Policy Synchronizer.
Hub Services
Hub-specific services: The must-have services on the hub to automate the data management on the Hubs such as Local Policy Synchronizer, Virtual MQTT, Context Sensing, etc
Tenant-specific services: The services that are set up for each tenant on the hubs such as OPA.
These components connect tightly together that create 3 main operations:
Data publishing and subscribing
Tenant-specific policy generation
Tenant-specific context data generation

![Alt text](/readme/img/cloud-hub-architecture.png?raw=true "Cloud-Hub Architecture")

#### Data Publishing and Subscribing

On every hub, multiple hub-specific applications are the data gateways for the clients to connect to. These applications need to connect to the OPA, a tenant-specific application, for authorization for per requests.

![Alt text](/readme/img/publish-subscribe-architecture.png?raw=true "Cloud-Hub Architecture")


### Version 2
The second version of this work extends the existing platform with a Edge-Platform-as-a-Service component.
By enabling deployment of in-hub tenant-applications, we simplify collection of shared data as devices in close proximity is no longer needed.
The in-hub tenant-applications use the existing hub infrastructure to subscribe to data, following the access control policy rules defined in OPA.

![Alt text](/readme/img/proof-of-concept-PaaS.drawio.png?raw=true "Cloud-Hub-PaaS Architecture")

In addition, we enable the decoupling of access control policies regarding processing rights, and sharing rights.
The result is privacy preserving capabilities, where an in-hub tenant-application may get access rights to process specific IoT-data to infer values, without exposing the IoT-data to the tenant. This is done using docker networks to restrict the network capabilites of the tenant-applications, forcing them to proxy requests through a nginx forward proxy which authenticates and authorizes in the same manner as the data platform.

![Alt text](/readme/img/forward_proxy_high_level.drawio.png?raw=true "Cloud-Hub-PaaS Architecture")


## Directory Structure

```
.
│   README.md:
│   readme\img
│
└───Cloud
│   └───Cloud-Kafka
│   |   -   docker-compose.yml
│   |   -   startup.sh
│   └───Cloud-Mongo
│   |   -   docker-compose.yml
│   |   -   startup.sh
│   |   -   datahub
│   └───ManagerApps
│       |───API
│       |   -   Dockerfile
│       |   -   *.js files
│       |───Context-Interpretation-Worker
│       |   -   Dockerfile
│       |   -   *.js files
│       |───Policy-Generator
│       |   -   Dockerfile
│       |   -   *.js files
│
└───Hubs
│   | -   docker-compose.yml
│   | -   startup.sh
│   └───ManagerApps
│   |   |───ContextSensing
│   |   |   -   Dockerfile
│   |   |   -   *.js files
│   └───OPA
│   |   |───ContextSensing
│   |   |   -   Dockerfile
│   |   |   -   *.js files
│   └───Policy-Synchronizer
│   |   |───ContextSensing
│   |   |   -   Dockerfile
│   |   |   -   *.js files
│   └───Streaming-Auth
│   |   |───ContextSensing
│   |   |   -   Dockerfile
│   |   |   -   *.js files
│   |   Streaming-Service
│   |   |───ContextSensing
│   |   |   -   Dockerfile
│   |   |   -   *.js files
│   |   VirtualMQTT
│   |   |───ContextSensing
│   |   |   -   Dockerfile
│   |   |   -   *.js files
│   └───TenantApps
│       |───Apps
│       |   |───Tenant1
│       |   |   |───FireDetectorKitchen
│       |   |───Tenant2
│       |   |   |───PersonCountCity
│       |   |   |───PersonCountFireKitchen
│       |───forward_proxy
|
|
└───Tenants
│   | -   docker-compose.yml
│   | -   startup_publisher_city.sh
│   | -   startup_publisher_kitchen.sh
│   | -   startup_web.sh
│   | -   startup_fire_alert_server.sh
│   └───Tenant-1:
│       |───Surveillance-Camera-City
│       |───Surveillance-Camera-Kitchen
│       Tenant-2:
│       |───FireAlertServer
│       Tenant-Web

```

## Sample Data

The sample data is in the folder: `Cloud/Infrastructure/seed`.
-   `tenants.json`
-   `policies.json`
-   `contexts.json`



# Steps to run the system

Prerequisite: You must install docker and docker-compose on your computer

1. Start cloud infrastructure: Kafka and MongoDB

```
./Cloud/Infrastructure/startup_infrastructure.sh
```

2. If initial tenant, policy and context data are not imported then seed MongoDB

```
./Cloud/Infrastructure/seed_db.sh
```

3. Start Cloud Manager Apps

```
./Cloud/ManagerApps/startup.sh
```

4. Start Hub Services and tenant applications

```
./Hub/startup.sh
```


## Running the scenarios with tenant apps
Start off with running the system as described above.

### People count
1. Start application for vizualization of the results
```
./Tenants/startup_web.sh
```

2. Go to http://localhost:30000/home

3. Start Publisher
```
./Tenants/startup_publisher_city.sh
```

### Fire alert
1. Start application for vizualization of the results
2. Ensure that hardcoded IP address in `Cloud/Infrastructure/seed/policies.json` and `Hub/TenantApps/Apps/Tenant2/PersonCountFireKitchen/analyze.py` refers to private IP of your host machine (often `192.168.1.156`, but not necessarily)
This IP address is used to loopback to host from docker container (when host network is not used) when running upstream application on localhost.

```
./Tenants/startup_fire_alert_server.sh
```

2. Go to http://192.168.1.156:3009

3. Start Publisher

```
./Tenants/startup_publisher_kitchen.sh
```


# Known implementation issues
1. The system might overload docker, especially when video feed is streamed.
We advice to either restart the whole system, or quit the publisher and restart the edge hub after demoing a scenario.

2. The system is not stable and will sometimes have issues with communication between tenant applications and the Virtual MQTT. The result is that data sent to the MQTT will not be received, which causes the Context-Sensing service to not process any contexts.
We advice to either restart the whole system, or quit the publisher and restart the edge hub after demoing a scenario.

3. The forward proxy implementation does not support proxying of HTTPS requests as the current nginx configuration does not have any specific modules to support it.
