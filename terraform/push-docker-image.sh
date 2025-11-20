#!/bin/bash

# Docker build and push commands
docker build --tag "$IMAGE_URL" ../.
docker push "$IMAGE_URL"


