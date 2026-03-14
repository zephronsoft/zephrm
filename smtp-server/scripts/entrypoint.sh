#!/bin/bash
set -e

export SMTP_MYHOSTNAME="${SMTP_MYHOSTNAME:-smtp.internal.local}"
export SMTP_MYDOMAIN="${SMTP_MYDOMAIN:-internal.local}"
export SMTP_MYNETWORKS="${SMTP_MYNETWORKS:-127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16}"
export SMTP_TLS_LEVEL="${SMTP_TLS_LEVEL:-may}"
export SMTP_MESSAGE_SIZE_LIMIT="${SMTP_MESSAGE_SIZE_LIMIT:-26214400}"

mkdir -p /var/spool/postfix /var/log/postfix /var/lib/postfix
touch /var/log/postfix/mail.log

# Only substitute our own env vars — do NOT let envsubst touch Postfix's own $var references
envsubst '${SMTP_MYHOSTNAME} ${SMTP_MYDOMAIN} ${SMTP_MYNETWORKS} ${SMTP_TLS_LEVEL} ${SMTP_MESSAGE_SIZE_LIMIT}' \
  < /etc/postfix/main.cf.template > /etc/postfix/main.cf

# Remove stale rsyslog pidfile left over from a previous container run
rm -f /run/rsyslogd.pid

if [[ -n "${SMTP_RELAYHOST}" ]]; then
  postconf -e "relayhost = [${SMTP_RELAYHOST}]:${SMTP_RELAYHOST_PORT:-587}"

  if [[ -n "${SMTP_RELAY_USERNAME}" && -n "${SMTP_RELAY_PASSWORD}" ]]; then
    echo "[${SMTP_RELAYHOST}]:${SMTP_RELAYHOST_PORT:-587} ${SMTP_RELAY_USERNAME}:${SMTP_RELAY_PASSWORD}" > /etc/postfix/sasl_passwd
    postmap /etc/postfix/sasl_passwd
    chmod 600 /etc/postfix/sasl_passwd /etc/postfix/sasl_passwd.db

    postconf -e "smtp_sasl_auth_enable = yes"
    postconf -e "smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd"
    postconf -e "smtp_sasl_security_options = noanonymous"
    postconf -e "smtp_tls_security_level = encrypt"
  fi
fi

postfix check || true

rsyslogd
postfix start

echo "Postfix SMTP relay started on ports 25/587..."

tail -F /var/log/postfix/mail.log
