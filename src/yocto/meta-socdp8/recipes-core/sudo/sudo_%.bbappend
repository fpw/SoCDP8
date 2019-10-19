do_install_append() {
    echo "%sudo ALL=(ALL) ALL" >> ${D}/${sysconfdir}/sudoers
}
