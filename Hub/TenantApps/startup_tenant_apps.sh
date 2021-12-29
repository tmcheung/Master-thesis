SCRIPT_DIR=$(dirname "$0")

for d in $SCRIPT_DIR/*; do
    if ! [ -d "$d" ]; then
        continue
    fi

    COMPOSE_FILE=$($d/docker-compose.yml)
    echo $COMPOSE_FILE
    docker-compose down -f $COMPOSE_FILE
    # docker-compose up -f $COMPOSE_FILE
    # docker-compose ps -f $COMPOSE_FILE
done