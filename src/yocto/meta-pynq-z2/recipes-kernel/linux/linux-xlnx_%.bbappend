FILESEXTRAPATHS_prepend := "${THISDIR}/${PN}:"
SRC_URI += "file://defconfig \
            file://zynq-pynqz2.dts;subdir=git/arch/${ARCH}/boot/dts \
            "
