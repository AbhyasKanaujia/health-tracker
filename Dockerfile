FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/health-tracker-0.0.1-SNAPSHOT.jar app.jar
RUN mkdir -p /app/data
VOLUME /app/data
EXPOSE 3003
ENTRYPOINT ["java", "-jar", "app.jar"]
