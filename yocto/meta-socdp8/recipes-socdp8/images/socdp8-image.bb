SUMMARY = "SoCDP-8 image"
DESCRIPTION = "SoCD-8 image"
LICENSE = "GPLv2+"

IMAGE_FEATURES = "ssh-server-openssh package-management"

IMAGE_INSTALL = "packagegroup-core-boot \
    packagegroup-base-wifi linux-firmware \
    openssh-sftp-server \
    devmem2 \
    socdp8-pidp8i-mod socdp8-core-mem-mod socdp8-io-mod \
    nodejs nodejs-npm \
    "

DISTRO_FEATURES = "wifi"

IMAGE_ROOTFS_SIZE = "32768"

inherit core-image
inherit extrausers

EXTRA_USERS_PARAMS = "\
    useradd -P socdp8 socdp8; \
    usermod -P socdp8 root; \
    "
