FILESEXTRAPATHS_prepend := "${THISDIR}/files:"

SRC_URI += " file://read_mac.patch \
             file://ps7_init_gpl.h \
             file://ps7_init_gpl.c \
             file://pynq_z2_defconfig \
             file://pynq-z2.h \
             file://pynq-z2.dts"

HAS_PLATFORM_INIT += "pynq_z2_config"

do_configure_prepend() {
        if test -e ${WORKDIR}/ps7_init_gpl.h; then
                mkdir -p ${S}/board/xilinx/zynq/${MACHINE}
                cp ${WORKDIR}/ps7_init_gpl.h ${S}/board/xilinx/zynq/${MACHINE}/
                cp ${WORKDIR}/ps7_init_gpl.c ${S}/board/xilinx/zynq/${MACHINE}/
                cp ${WORKDIR}/*_defconfig ${S}/configs/
                cp ${WORKDIR}/${MACHINE}.h ${S}/include/configs/
                cp ${WORKDIR}/${MACHINE}.dts ${S}/arch/arm/dts
                chmod 664 ${S}/board/xilinx/zynq/${MACHINE}/*
        fi
}
