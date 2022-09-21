./TenantApps/shutdown_tenant_apps.sh
./TenantApps/shutdown_forward_proxy.sh
docker-compose down

docker-compose up --build -d
./TenantApps/setup_forward_proxy.sh

./TenantApps/startup_tenant_apps.sh
docker-compose ps

# dirty hack to for race condition
docker restart managerapps_policy-generator_1 