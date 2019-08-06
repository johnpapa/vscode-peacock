#!/bin/bash
az storage blob upload-batch \
  -d '$web' \
  --account-name papapeacockstorage \
  -s '$1' \
  --pattern '*'
