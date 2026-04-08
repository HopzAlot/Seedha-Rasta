# -----------------------------------
# Stage 1: Builder
# -----------------------------------
FROM python:3.12-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install everything needed to compile C-extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    python3-dev \
    libpq-dev \
    libgeos-dev \
    libproj-dev \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Help the compiler find GDAL headers
ENV CPLUS_INCLUDE_PATH=/usr/include/gdaln
ENV C_INCLUDE_PATH=/usr/include/gdal

RUN pip install --no-cache-dir --upgrade pip wheel setuptools

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# -----------------------------------
# Stage 2: Runtime image
# -----------------------------------
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=backend.settings

# Install the runtime versions of the geo-libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgeos-c1v5 \
    libproj25 \
    gdal-bin \
    && rm -rf /var/lib/apt/lists/*

# Copy the compiled site-packages from the builder
COPY --from=builder /usr/local /usr/local

# Copy your project files
COPY . .

EXPOSE 8000

# Copy the script from your local folder into the container root
COPY entrypoint.sh /app/entrypoint.sh

# Give it execution permissions
RUN sed -i 's/\r$//' /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Set it as the default entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]