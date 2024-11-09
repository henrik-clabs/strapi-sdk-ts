#!/usr/bin/env bash

CONTAINER_NAME=strapi-sdk-test
IMAGE_NAME=strapi-sdk-image
CONTAINER_PORT="1337:1337"

echo "Stopping container..."
docker stop ${CONTAINER_NAME}
RC=$?

if [ $RC -ne 0 ]; then
  echo "Stop failed ..."
  exit 1
fi