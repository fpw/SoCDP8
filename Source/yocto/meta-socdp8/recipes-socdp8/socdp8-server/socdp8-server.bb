# Recipe created by recipetool

SUMMARY = "SoCDP8 server application"
PV = "0.0.1"
PR = "r5"

LICENSE = "AGPL-3.0 & MIT"
LIC_FILES_CHKSUM = "file://COPYING;md5=eb1e647870add0502f8f010b19de32af"

SRC_URI = "file://socdp8-server-${PV}.tgz file://systems.tar.gz;unpack=false"

inherit npm
inherit useradd

USERADD_PACKAGES = "${PN}"
GROUPADD_PARAM_${PN} = "sudo"
USERADD_PARAM_${PN} = "-P socdp8 -d /home/socdp8 -s /bin/bash socdp8"
GROUPMEMS_PARAM_${PN} = "-a socdp8 -g sudo"

S = "${WORKDIR}/package"

do_install_append() {
    install -m 0755 -d ${D}/home/socdp8
    tar --no-same-owner -zxvf ${WORKDIR}/systems.tar.gz -C ${D}/home/socdp8
    
    chown socdp8 -R ${D}/home/socdp8/systems
}

FILES_${PN} += "/home/socdp8/systems/"
