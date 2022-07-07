SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
CONTAINER_NAME="forward_proxy"

docker rm $CONTAINER_NAME
docker run \
    -p 8888:8888 \
    -v $SCRIPT_DIR/opa_auth.js:/usr/local/nginx/conf/opa_auth.js \
    -v $SCRIPT_DIR/nginx_opa_forward_proxy.conf:/usr/local/nginx/conf/nginx.conf \
    --name $CONTAINER_NAME \
    tmcheung/nginx_proxy:0.0.1