docker-compose down
docker-compose up --build -d
./TenantApps/startup_tenant_apps.sh
docker-compose ps