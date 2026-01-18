#!/bin/bash
set -xe

yum update -y

# Java 17
yum install -y java-17-amazon-corretto-devel

# Python
yum install -y python3 python3-pip

java -version
javac -version
python3 --version
