SUMMARY = "SoCDP8 FPGA bitstream"
LICENSE = "AGPL-3.0"
LIC_FILES_CHKSUM = "file://COPYING;md5=eb1e647870add0502f8f010b19de32af"

SRC_URI = "file://zynqberry.bit \
           file://COPYING \
"

S = "${WORKDIR}"

inherit deploy

do_deploy() {
	install -Dm 0644 ${WORKDIR}/zynqberry.bit ${DEPLOYDIR}
}
addtask do_deploy after do_compile before do_build

PACKAGES = "${PN}"
PROVIDES = "zynqberry-bitstream"
