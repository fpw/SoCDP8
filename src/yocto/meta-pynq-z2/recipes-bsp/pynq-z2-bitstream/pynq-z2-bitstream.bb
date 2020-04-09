SUMMARY = "SoCDP8 FPGA bitstream"
LICENSE = "AGPL-3.0"
LIC_FILES_CHKSUM = "file://COPYING;md5=eb1e647870add0502f8f010b19de32af"

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
