SUMMARY = "SoCDP8 startup script"
LICENSE = "GPLv2"
LIC_FILES_CHKSUM = "file://COPYING;md5=12f884d2ae1ff87c09e5b7ccc2c4ca7e"

RDEPENDS_${PN} = "udev bash"

SRC_URI = "file://20-socdp8.rules \
           file://socdp8 \
           file://COPYING \
"

S = "${WORKDIR}"

do_install () {
    install -d ${D}${sysconfdir}/udev/rules.d
    install -m 0644 ${S}/20-socdp8.rules ${D}${sysconfdir}/udev/rules.d/

    install -d ${D}${sysconfdir}/init.d
    install -d ${D}${sysconfdir}/rcS.d

    install -m 0755 ${WORKDIR}/socdp8  ${D}${sysconfdir}/init.d/
    ln -sf ../init.d/socdp8  ${D}${sysconfdir}/rcS.d/S90socdp8
}

FILES_${PN} += " /etc/udev/rules.d/20-socdp8.rules"
FILES_${PN} += " /etc/init.d/socdp8"
FILES_${PN} += " /etc/rcS.d/S90socdp8"

PACKAGES = "${PN}"
PROVIDES = "socdp8-udev-rules"
