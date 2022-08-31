SCRIPT_DIR=$(dirname "$0")
COMPOSE_FILE="$SCRIPT_DIR/forward_proxy/docker-compose.yml"
docker-compose -f $COMPOSE_FILE up --build -d
docker-compose ps