# Recipe created by recipetool

SUMMARY = "SoCDP8 server application"
PV = "0.0.1"

LICENSE = "AGPL-3.0 & MIT"
LIC_FILES_CHKSUM = "file://COPYING;md5=eb1e647870add0502f8f010b19de32af"

SRC_URI = "file://socdp8-server-${PV}.tgz \
           npm://registry.npmjs.org;name=cors;version=2.8.5;subdir=node_modules/cors \
           npm://registry.npmjs.org;name=express;version=4.17.1;subdir=node_modules/express \
           npm://registry.npmjs.org;name=mmap-io;version=1.1.7;subdir=node_modules/mmap-io \
           npm://registry.npmjs.org;name=socket.io;version=2.3.0;subdir=node_modules/socket.io \
           "

NPM_SHRINKWRAP := "${THISDIR}/files/npm-shrinkwrap.json"

inherit npm

S = "${WORKDIR}/package"

do_install_append() {
    find "${D}" -name package.json | xargs chown root:root
}

LICENSE_${PN}-cors = "MIT"
LICENSE_${PN}-express = "MIT"
LICENSE_${PN}-mmap-io = "MIT"
LICENSE_${PN}-socket.io = "MIT"
