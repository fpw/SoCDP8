SUMMARY = "SoCDP8 udev rules"
LICENSE = "GPLv2"
LIC_FILES_CHKSUM = "file://COPYING;md5=12f884d2ae1ff87c09e5b7ccc2c4ca7e"

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
PROVIDES = "socdp8-udev-rules"
