SUMMARY = "SoCDP8 udev rules"
LICENSE = "AGPL-3.0"
LIC_FILES_CHKSUM = "file://COPYING;md5=eb1e647870add0502f8f010b19de32af"

RDEPENDS_${PN} = "udev bash"

SRC_URI = "file://20-socdp8.rules \
           file://COPYING \
"

S = "${WORKDIR}"

do_install () {
    install -d ${D}${sysconfdir}/udev/rules.d
    install -m 0644 ${S}/20-socdp8.rules ${D}${sysconfdir}/udev/rules.d/
}

FILES_${PN} += " /etc/udev/rules.d/20-socdp8.rules"

PACKAGES = "${PN}"
PROVIDES = "uio-udev-rules"
