#!/bin/sh
### BEGIN INIT INFO
# Provides:          socdp8-server
# Required-Start:    $remote_fs $syslog
# Required-Stop:     $remote_fs $syslog
# Default-Start:     3
# Default-Stop:      0 1 6
# Short-Description: Start SoCDP8 at boot time
# Description:       Enable SoCP8 server
### END INIT INFO

NAME=socdp8-server
PIDFILE=/var/run/$NAME.pid

DAEMON=/usr/bin/node
DAEMON_OPTS=/usr/lib/node_modules/socdp8-server/lib/main.js
DAEMON_ENV=""
DAEMON_USER=socdp8
DAEMON_HOME=/home/socdp8

export PATH="${PATH:+$PATH:}/usr/sbin:/sbin"

. /etc/init.d/functions

do_start()
{
    cd $DAEMON_HOME
    start-stop-daemon --start --background --make-pidfile --pidfile $PIDFILE -c $DAEMON_USER --exec /usr/bin/env -- $DAEMON_ENV $DAEMON $DAEMON_OPTS
}

do_stop()
{
    start-stop-daemon --stop --pidfile $PIDFILE
}

case "$1" in
    start)
        echo -n "Starting $NAME..."
        do_start && success || failure
        RETVAL=$?
        echo "."
        ;;
    stop)
        echo -n "Stopping $NAME..."
        do_stop && success || failure
        RETVAL=$?
        echo "."
        ;;
    restart)
        echo -n "Restarting $NAME..."
        do_stop
        do_start && success || failure
        RETVAL=$?
        echo "."
        ;;
    *)
        echo "Usage $0 {start|stop|restart}"
        RETVAL=1
esac

exit $RETVAL
