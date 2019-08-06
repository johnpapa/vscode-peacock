#!/bin/bash
SOURCE=$1

az storage blob upload-batch \
  -d '$web' \
  --account-name papapeacockstorage \
  -s $SOURCE \
  --pattern '*'
