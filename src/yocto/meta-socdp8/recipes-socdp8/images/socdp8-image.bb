SUMMARY = "SoCDP-8 image"
DESCRIPTION = "SoCD-8 image"
LICENSE = "AGPLv3+"

# add read-only-rootfs for release
IMAGE_FEATURES = "ssh-server-openssh package-management"

IMAGE_FSTYPES = "wic"

# add linux-firmware for WiFi firmware files

IMAGE_INSTALL = "packagegroup-core-boot kernel-modules \
    packagegroup-base-wifi \
    haveged \
    openssh-sftp-server \
    sudo nano \
    socat \
    devmem2 \
    uio-udev-rules \
    nodejs nodejs-npm \
    socdp8-server socdp8-startup \
    "

DISTRO_FEATURES = "wifi"

BAD_RECOMMENDATIONS = "rng-tools"

inherit core-image
