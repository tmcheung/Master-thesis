# Benchmark data service authorization 

Measure publish to message receival time: the time to send 1000 messages
Divide time by 1000 to find average throughput per message with single tenant

## After setting up the system:
Run `docker-compose run sub`
Run `docker-compose run pub`


To measure without auth:
Set `SKIP_AUTH=true` in .env