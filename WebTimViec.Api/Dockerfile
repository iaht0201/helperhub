# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["WebTimViec.Api/WebTimViec.Api.csproj", "WebTimViec.Api/"]
RUN dotnet restore "WebTimViec.Api/WebTimViec.Api.csproj"

# Copy everything and build
COPY . .
WORKDIR "/src/WebTimViec.Api"
RUN dotnet build "WebTimViec.Api.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "WebTimViec.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
EXPOSE 5281
ENV ASPNETCORE_URLS=http://+:5281

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WebTimViec.Api.dll"]
