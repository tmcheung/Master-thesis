SCRIPT_DIR=$(dirname "$0")

for d in $SCRIPT_DIR/Apps/*; do
    if ! [ -d "$d" ]; then
        continue
    fi

    COMPOSE_FILE="$d/docker-compose.yml"
    if ! [ -f $COMPOSE_FILE ]; then
        continue
    fi

    docker-compose -f $COMPOSE_FILE up --build -d
    docker-compose -f $COMPOSE_FILE ps
done