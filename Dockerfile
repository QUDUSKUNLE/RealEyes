# Speciy node version
FROM node:14

# Create a directory
RUN mkdir -p /usr/src/app

# Working directory
WORKDIR /usr/src/app

# Copy dependencies
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy environment variables
COPY .env .env

# bundle the app
COPY . .

# Expose the app
EXPOSE 4000

# Run the app
CMD ["npm", "start"]
