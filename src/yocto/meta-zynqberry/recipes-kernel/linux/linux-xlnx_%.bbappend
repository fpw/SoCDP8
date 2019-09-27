FILESEXTRAPATHS_prepend := "${THISDIR}/${PN}:"
SRC_URI += "file://defconfig \
            file://zynqberry.dts;subdir=git/arch/${ARCH}/boot/dts \
            "
