# 1. Giai đoạn Build (Dùng ảnh Gradle có sẵn Java 21)
FROM gradle:jdk21-jammy AS build
WORKDIR /home/gradle/src
COPY --chown=gradle:gradle . .
# Build ứng dụng (bỏ qua test để nhanh hơn)
RUN gradle build --no-daemon -x test

# 2. Giai đoạn Run (Dùng ảnh Java nhẹ để chạy)
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
# Copy file .jar từ giai đoạn build sang giai đoạn run
COPY --from=build /home/gradle/src/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]