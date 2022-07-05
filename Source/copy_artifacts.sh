#!/bin/bash
cp -v server/socdp8-server-0.0.1.tgz yocto/meta-socdp8/recipes-socdp8/socdp8-server/files/
cp -v fpga/vivado_projects/pynq-z2/pynq-z2.runs/impl_1/pynq_z2_block_wrapper.bit yocto/meta-pynq-z2/recipes-bsp/pynq-z2-bitstream/files/pynq-z2.bit
cp -v fpga/vivado_projects/zynqberry/zynqberry.runs/impl_1/zynqberry_block_wrapper.bit yocto/meta-zynqberry/recipes-bsp/zynqberry-bitstream/files/zynqberry.bit
