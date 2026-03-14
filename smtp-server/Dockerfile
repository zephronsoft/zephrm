FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y postfix rsyslog mailutils libsasl2-modules gettext-base && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -r postfixgrp && useradd -r -g postfixgrp postfixuser || true

COPY config/main.cf /etc/postfix/main.cf.template
COPY config/master.cf /etc/postfix/master.cf
COPY scripts/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh && \
    mkdir -p /var/spool/postfix /var/log/postfix /var/lib/postfix && \
    chown -R root:root /etc/postfix && \
    chmod 644 /etc/postfix/main.cf.template /etc/postfix/master.cf

EXPOSE 25 587

CMD ["/entrypoint.sh"]
