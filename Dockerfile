FROM node:lts-bullseye-slim

ENV APSERVER_VERSION 0.7.5
ENV APSERVER_HOME /opt/apzohub/apserver

WORKDIR $APSERVER_HOME

EXPOSE 8443

CMD ["./start.sh"]