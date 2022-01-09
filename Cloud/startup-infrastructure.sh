
COMPOSE_FILE="-f docker-compose-infrastructure.yml -f ./Cloud-Kafka/docker-compose.yml -f ./Cloud-Mongo/docker-compose.yml"
# docker-compose $COMPOSE_FILE down
docker-compose $COMPOSE_FILE up -d
docker-compose $COMPOSE_FILE ps