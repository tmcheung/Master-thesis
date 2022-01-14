FROM mongo:5.0
 # Will be set through Environment Files
ARG DATABASE_URI
ARG USERNAME
ARG PASSWORD

ENV DATABASE_URI ${DATABASE_URI}
ENV USERNAME ${USERNAME}
ENV PASSWORD ${PASSWORD}

COPY . .

CMD mongoimport --authenticationDatabase admin -u ${USERNAME} -p ${PASSWORD} --uri ${DATABASE_URI} --collection contexts --drop --file contexts.json --jsonArray && \
    mongoimport --authenticationDatabase admin -u ${USERNAME} -p ${PASSWORD} --uri ${DATABASE_URI} --collection policies --drop --file policies.json --jsonArray && \
    mongoimport --authenticationDatabase admin -u ${USERNAME} -p ${PASSWORD} --uri ${DATABASE_URI} --collection tenants --drop --file tenants.json --jsonArray