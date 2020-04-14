# Recipe created by recipetool

SUMMARY = "SoCDP8 client application"
PV = "0.0.1"

LICENSE = "AGPL-3.0 & MIT"
LIC_FILES_CHKSUM = "file://COPYING;md5=eb1e647870add0502f8f010b19de32af"

SRC_URI = "file://socdp8-client-${PV}.tgz \
           npm://registry.npmjs.org;name=mobx;version=5.15.4;subdir=node_modules/mobx \
           npm://registry.npmjs.org;name=mobx-react;version=6.2.0;subdir=node_modules/mobx-react \
           npm://registry.npmjs.org;name=react;version=16.13.1;subdir=node_modules/react \
           npm://registry.npmjs.org;name=react-dom;version=16.13.1;subdir=node_modules/react-dom \
           npm://registry.npmjs.org;name=socket.io-client;version=2.3.0;subdir=node_modules/socket.io-client \
           "

NPM_SHRINKWRAP := "${THISDIR}/files/npm-shrinkwrap.json"

inherit npm

S = "${WORKDIR}/package"

do_install_append() {
    find "${D}" -name package.json | xargs chown root:root
}

LICENSE_${PN}-bulma = "MIT"
LICENSE_${PN}-mobx = "MIT"
LICENSE_${PN}-mobx-react = "MIT"
LICENSE_${PN}-react-dom = "MIT"
LICENSE_${PN}-react = "MIT"
LICENSE_${PN}-socket.io-client = "MIT"
