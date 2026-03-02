# ============================================================
# Stage 1: Install PHP dependencies (composer build layer)
# ============================================================
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --no-interaction

COPY . .

RUN composer dump-autoload --optimize --no-dev --classmap-authoritative \
    && rm -f bootstrap/cache/packages.php bootstrap/cache/services.php

# ============================================================
# Stage 2: Production runtime
# ============================================================
FROM php:8.4-fpm-alpine AS runtime

# Build-time deps only (removed after extension compilation)
RUN apk add --no-cache --virtual .build-deps \
        $PHPIZE_DEPS \
        libpq-dev \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        opcache \
        pcntl \
    && apk del .build-deps \
    && apk add --no-cache \
        libpq \
        nginx \
        supervisor \
        curl

# PHP production configuration
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY docker/php/opcache.ini  $PHP_INI_DIR/conf.d/opcache.ini
COPY docker/php/php-fpm.conf /usr/local/etc/php-fpm.d/zz-docker.conf
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /var/www/html

# Copy application code (without dev files)
COPY --chown=www-data:www-data . .
COPY --from=vendor --chown=www-data:www-data /app/vendor ./vendor

# Remove dev files and stale bootstrap cache
RUN rm -rf \
    tests \
    docker \
    storage/logs/*.log \
    .env.example \
    phpunit.xml \
    docker-compose.yml \
    README.md \
    bootstrap/cache/packages.php \
    bootstrap/cache/services.php

# Prepare Laravel storage & cache directories
RUN mkdir -p \
        storage/framework/sessions \
        storage/framework/views \
        storage/framework/cache/data \
        storage/logs \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -sf http://127.0.0.1/v1/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
