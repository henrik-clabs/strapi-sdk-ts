#!/usr/bin/env bash

CONTAINER_NAME=strapi-sdk-test
IMAGE_NAME=strapi-sdk-image
CONTAINER_PORT="1337:1337"


# Starting container
docker run -d --rm \
  --name ${CONTAINER_NAME} \
  -p ${CONTAINER_PORT} \
  ${IMAGE_NAME}
RC=$?

if [ $RC -ne 0 ]; then
  echo "Start failed ..."
  exit 1
fi
echo "waiting 25s for Strapi to start..."
sleep 25
