#!/usr/bin/env bash
set -e

pip install -r requirements.txt
python train/generate_data.py
python train/train_model.py