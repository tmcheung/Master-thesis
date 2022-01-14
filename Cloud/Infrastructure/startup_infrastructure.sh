COMPOSE_FILE="-f docker-compose-base.yml -f docker-compose-kafka.yml -f docker-compose-mongo.yml"
docker-compose $COMPOSE_FILE down
# docker volume rm infrastructure_zookeeper_data
# docker volume rm infrastructure_kafka_data
docker-compose $COMPOSE_FILE up -d
docker-compose $COMPOSE_FILE ps