# Recipe created by recipetool
# This is the basis of a recipe and may need further editing in order to be fully functional.
# (Feel free to remove these comments when editing.)

SUMMARY = "io.js/node.js mmap bindings revisited."
HOMEPAGE = "https://github.com/ozra/mmap-io"
# WARNING: the following LICENSE and LIC_FILES_CHKSUM values are best guesses - it is
# your responsibility to verify that the values are complete and correct.
#
# The following license files were not able to be identified and are
# represented as "Unknown" below, you will need to check them yourself:
#   node_modules/prr/LICENSE.md
#   node_modules/typescript/LICENSE.txt
#   node_modules/typescript/CopyrightNotice.txt
#   node_modules/@types/node/LICENSE
#   node_modules/nan/LICENSE.md
#   node_modules/source-map/LICENSE
#
# NOTE: multiple licenses have been detected; they have been separated with &
# in the LICENSE value for now since it is a reasonable assumption that all
# of the licenses apply. If instead there is a choice between the multiple
# licenses then you should change the value to separate the licenses with |
# instead of &. If there is any doubt, check the accompanying documentation
# to determine which situation is applicable.
LICENSE = "BSD-3-Clause & Apache-2.0 & MIT"
LIC_FILES_CHKSUM = "file://LICENSE;md5=b480954faa501ba20ce9b9d5e2dbbfd7 \
                    file://node_modules/prr/LICENSE.md;md5=75bd46e30eb2544a54966a0b2b6204ca \
                    file://node_modules/type-check/LICENSE;md5=7733af876e78a187f3a51e7c276ae883 \
                    file://node_modules/bindings/LICENSE.md;md5=471723f32516f18ef36e7ef63580e4a8 \
                    file://node_modules/typescript/LICENSE.txt;md5=55a8748c7d5c7253f3e4bb7402ff04db \
                    file://node_modules/typescript/CopyrightNotice.txt;md5=435edc9bf4ec470ea6a28f258ecd7f52 \
                    file://node_modules/buffer-from/LICENSE;md5=46513463e8f7d9eb671a243f0083b2c6 \
                    file://node_modules/optionator/LICENSE;md5=7733af876e78a187f3a51e7c276ae883 \
                    file://node_modules/levn/LICENSE;md5=7733af876e78a187f3a51e7c276ae883 \
                    file://node_modules/fast-levenshtein/LICENSE.md;md5=a3e99e82761a3c89e44fe0bc43f82b94 \
                    file://node_modules/prelude-ls/LICENSE;md5=7733af876e78a187f3a51e7c276ae883 \
                    file://node_modules/@types/node/LICENSE;md5=27e94c0280987ab296b0b8dd02ab9fe5 \
                    file://node_modules/nan/LICENSE.md;md5=e6270b7774528599f2623a4aeb625829 \
                    file://node_modules/source-map-support/LICENSE.md;md5=f433e270f6b1d088c38b279d53048f5e \
                    file://node_modules/deep-is/LICENSE;md5=fb19b42ee6322a4b61b6277fb9e13d89 \
                    file://node_modules/file-uri-to-path/LICENSE;md5=9513dc0b97137379cfabc81b60889174 \
                    file://node_modules/livescript/LICENSE;md5=199d14cc8de8f6e34f804020e685f4f2 \
                    file://node_modules/source-map/LICENSE;md5=b1ca6dbc0075d56cbd9931a75566cd44 \
                    file://node_modules/wordwrap/LICENSE;md5=aea1cde69645f4b99be4ff7ca9abcce1"

SRC_URI = "npm://registry.npmjs.org/;name=mmap-io;version=${PV}"

NPM_SHRINKWRAP := "${THISDIR}/${PN}/npm-shrinkwrap.json"

inherit npm

do_compile_prepend() {
  rm package-lock.json
}

# Must be set after inherit npm since that itself sets S
S = "${WORKDIR}/npmpkg"
LICENSE_${PN}-bindings = "MIT"
LICENSE_${PN}-buffer-from = "MIT"
LICENSE_${PN}-deep-is = "MIT"
LICENSE_${PN}-errno = "MIT"
LICENSE_${PN}-fast-levenshtein = "MIT"
LICENSE_${PN}-file-uri-to-path = "MIT"
LICENSE_${PN}-levn = "MIT"
LICENSE_${PN}-livescript = "MIT"
LICENSE_${PN}-nan = "MIT"
LICENSE_${PN}-optionator = "MIT"
LICENSE_${PN}-prelude-ls = "MIT"
LICENSE_${PN}-prr = "MIT"
LICENSE_${PN}-source-map-support = "MIT"
LICENSE_${PN}-source-map = "BSD-3-Clause"
LICENSE_${PN}-type-check = "MIT"
LICENSE_${PN}-typescript = "Apache-2.0"
LICENSE_${PN}-wordwrap = "MIT"
LICENSE_${PN} = "MIT"


