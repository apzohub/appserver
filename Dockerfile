FROM node:lts-bullseye-slim

ENV APSERVER_VERSION 1.0.0
ENV APSERVER_HOME /opt/apzohub/apserver

WORKDIR $APSERVER_HOME

EXPOSE 8443

CMD ["./start.sh"]