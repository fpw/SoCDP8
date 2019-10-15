SUMMARY = "SoCDP-8 image"
DESCRIPTION = "SoCD-8 image"
LICENSE = "GPLv2+"

# add read-only-rootfs for release
IMAGE_FEATURES = "ssh-server-openssh package-management"

# add linux-firmware for WiFi firmware files

IMAGE_INSTALL = "packagegroup-core-boot kernel-modules \
    packagegroup-base-wifi \
    openssh-sftp-server \
    devmem2 \
    socdp8-udev-rules \
    nodejs nodejs-npm mmap-io \
    "
    
DISTRO_FEATURES = "wifi"

inherit core-image
inherit extrausers

EXTRA_USERS_PARAMS = "\
    useradd -P socdp8 socdp8; \
    usermod -P socdp8 root; \
    "
