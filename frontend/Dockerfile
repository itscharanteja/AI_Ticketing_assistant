FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Accept build arguments
ARG REACT_APP_TICKET_API_URL
ARG REACT_APP_AI_API_URL

# Set environment variables
ENV REACT_APP_TICKET_API_URL=$REACT_APP_TICKET_API_URL
ENV REACT_APP_AI_API_URL=$REACT_APP_AI_API_URL

EXPOSE 3000

# Start the app in development mode
CMD ["npm", "start"]