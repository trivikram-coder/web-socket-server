# Base Node image
FROM node:18

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    openjdk-17-jdk \
    python3 \
    python3-pip \
    && apt-get clean

# Set JAVA environment
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH="$JAVA_HOME/bin:$PATH"

# App directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install node dependencies
RUN npm install

# Install TypeScript & ts-node globally (SAFE + SIMPLE)
RUN npm install -g typescript ts-node

# Copy rest of the code
COPY . .

# Expose backend port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
