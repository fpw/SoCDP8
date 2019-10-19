SUMMARY = "SoCDP-8 image"
DESCRIPTION = "SoCD-8 image"
LICENSE = "GPLv2+"

# add read-only-rootfs for release
IMAGE_FEATURES = "ssh-server-openssh package-management"

IMAGE_FSTYPES = "wic"

# add linux-firmware for WiFi firmware files

IMAGE_INSTALL = "packagegroup-core-boot kernel-modules \
    packagegroup-base-wifi \
    openssh-sftp-server \
    sudo \
    socat \
    devmem2 \
    uio-udev-rules \
    nodejs nodejs-npm mmap-io \
    "
    
DISTRO_FEATURES = "wifi"

inherit core-image
inherit extrausers

EXTRA_USERS_PARAMS = "\
    useradd -P socdp8 socdp8; \
    usermod -aG sudo socdp8; \
    "
