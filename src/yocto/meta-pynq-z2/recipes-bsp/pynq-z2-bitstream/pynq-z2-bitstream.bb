SUMMARY = "SoCDP8 FPGA bitstream"
LICENSE = "GPLv2"
LIC_FILES_CHKSUM = "file://COPYING;md5=12f884d2ae1ff87c09e5b7ccc2c4ca7e"

SRC_URI = "file://pynq-z2.bit \
           file://COPYING \
"

S = "${WORKDIR}"

inherit deploy

do_deploy() {
	install -Dm 0644 ${WORKDIR}/pynq-z2.bit ${DEPLOYDIR}
}
addtask do_deploy after do_compile before do_build

PACKAGES = "${PN}"
PROVIDES = "pynq-z2-bitstream"
