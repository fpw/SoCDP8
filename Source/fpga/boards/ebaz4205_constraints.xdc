set_property BITSTREAM.GENERAL.COMPRESS TRUE [current_design]
set_property CONFIG_VOLTAGE 3.3 [current_design]
set_property CFGBVS VCCO [current_design]
set_property BITSTREAM.CONFIG.UNUSEDPIN PULLUP [current_design]

# GPIO2 - Pin 3 - Col1a
#set_property PACKAGE_PIN K15 [get_ports {gpio[0]}]
# GPIO3 - Pin 5 - Col2a
#set_property PACKAGE_PIN J14 [get_ports {gpio[1]}]
# GPIO19 - Pin 35 - Free (P17)
#set_property PACKAGE_PIN R12 [get_ports {gpio[17]}]

# Column pins
set_property IOSTANDARD LVCMOS33 [get_ports {column[*]}]
set_property PULLUP true [get_ports {column[11]}]
set_property PULLUP true [get_ports {column[10]}]
set_property PULLUP true [get_ports {column[9]}]
set_property PULLUP true [get_ports {column[8]}]
set_property PULLUP true [get_ports {column[7]}]
set_property PULLUP true [get_ports {column[6]}]
set_property PULLUP true [get_ports {column[5]}]
set_property PULLUP true [get_ports {column[4]}]
set_property PULLUP true [get_ports {column[3]}]
set_property PULLUP true [get_ports {column[2]}]
set_property PULLUP true [get_ports {column[1]}]
set_property PULLUP true [get_ports {column[0]}]
# DATA1-5 - Col1
set_property PACKAGE_PIN A20 [get_ports {column[0]}]
# DATA1-7 - Col2
set_property PACKAGE_PIN B19 [get_ports {column[1]}]
# DATA1-9 - Col3
set_property PACKAGE_PIN C20 [get_ports {column[2]}]
# DATA1-18 - Col4
set_property PACKAGE_PIN E19 [get_ports {column[3]}]
# DATA1-16 - Col5
set_property PACKAGE_PIN D19 [get_ports {column[4]}]
# DATA2-19 - Col6
set_property PACKAGE_PIN M20 [get_ports {column[5]}]
# DATA2-17 - Col7
set_property PACKAGE_PIN M18 [get_ports {column[6]}]
# DATA1-19 - Col8
set_property PACKAGE_PIN F19 [get_ports {column[7]}]
# DATA1-17 - Col9
set_property PACKAGE_PIN F20 [get_ports {column[8]}]
# DATA1-20 - Col10
set_property PACKAGE_PIN K17 [get_ports {column[9]}]
# DATA2-20 - Col11
set_property PACKAGE_PIN L17 [get_ports {column[10]}]
# DATA1-14 - Col12
set_property PACKAGE_PIN D18 [get_ports {column[11]}]

# Switch row pins
set_property IOSTANDARD LVCMOS33 [get_ports {switch_row[*]}]
# DATA2-18 - SwitchRow1
set_property PACKAGE_PIN L20 [get_ports {switch_row[0]}]
# DATA1-11 - SwitchRow2
set_property PACKAGE_PIN H17 [get_ports {switch_row[1]}]
# DATA2-9 - SwitchRow3
set_property PACKAGE_PIN J19 [get_ports {switch_row[2]}]

# LED row pins
set_property IOSTANDARD LVCMOS33 [get_ports {led_row[*]}]
# DATA2-16 - LedRow1
set_property PACKAGE_PIN L19 [get_ports {led_row[0]}]
# DATA2-14 - LedRow2
set_property PACKAGE_PIN J20 [get_ports {led_row[1]}]
# DATA1-15 - LedRow3
set_property PACKAGE_PIN H18 [get_ports {led_row[2]}]
# DATA2-11 - LedRow4
set_property PACKAGE_PIN K18 [get_ports {led_row[3]}]
# DATA2-13 - LedRow5
set_property PACKAGE_PIN K19 [get_ports {led_row[4]}]
# DATA2-15 - LedRow6
set_property PACKAGE_PIN L16 [get_ports {led_row[5]}]
# DATA1-6 - LedRow7
set_property PACKAGE_PIN H16 [get_ports {led_row[6]}]
# DATA1-13 - LedRow8
set_property PACKAGE_PIN D20 [get_ports {led_row[7]}]

set_property IOSTANDARD LVCMOS33 [get_ports ENET0_GMII_RX_CLK_0]
set_property IOSTANDARD LVCMOS33 [get_ports ENET0_GMII_RX_DV_0]
set_property IOSTANDARD LVCMOS33 [get_ports ENET0_GMII_TX_CLK_0]
set_property PACKAGE_PIN U14 [get_ports ENET0_GMII_RX_CLK_0]
set_property PACKAGE_PIN U15 [get_ports ENET0_GMII_TX_CLK_0]
set_property PACKAGE_PIN W16 [get_ports ENET0_GMII_RX_DV_0]
set_property IOSTANDARD LVCMOS33 [get_ports MDIO_ETHERNET_0_0_mdc]
set_property IOSTANDARD LVCMOS33 [get_ports MDIO_ETHERNET_0_0_mdio_io]
set_property PACKAGE_PIN W15 [get_ports MDIO_ETHERNET_0_0_mdc]
set_property PACKAGE_PIN Y14 [get_ports MDIO_ETHERNET_0_0_mdio_io]
set_property IOSTANDARD LVCMOS33 [get_ports {ENET0_GMII_TX_EN_0[0]}]
set_property PACKAGE_PIN W19 [get_ports {ENET0_GMII_TX_EN_0[0]}]
set_property PACKAGE_PIN Y17 [get_ports {enet0_gmii_rxd[3]}]
set_property PACKAGE_PIN V17 [get_ports {enet0_gmii_rxd[2]}]
set_property PACKAGE_PIN V16 [get_ports {enet0_gmii_rxd[1]}]
set_property PACKAGE_PIN Y16 [get_ports {enet0_gmii_rxd[0]}]
set_property IOSTANDARD LVCMOS33 [get_ports {enet0_gmii_rxd[3]}]
set_property IOSTANDARD LVCMOS33 [get_ports {enet0_gmii_rxd[2]}]
set_property IOSTANDARD LVCMOS33 [get_ports {enet0_gmii_rxd[1]}]
set_property IOSTANDARD LVCMOS33 [get_ports {enet0_gmii_rxd[0]}]
set_property IOSTANDARD LVCMOS33 [get_ports {enet0_gmii_txd[3]}]
set_property IOSTANDARD LVCMOS33 [get_ports {enet0_gmii_txd[2]}]
set_property IOSTANDARD LVCMOS33 [get_ports {enet0_gmii_txd[1]}]
set_property IOSTANDARD LVCMOS33 [get_ports {enet0_gmii_txd[0]}]
set_property PACKAGE_PIN Y19 [get_ports {enet0_gmii_txd[3]}]
set_property PACKAGE_PIN V18 [get_ports {enet0_gmii_txd[2]}]
set_property PACKAGE_PIN Y18 [get_ports {enet0_gmii_txd[1]}]
set_property PACKAGE_PIN W18 [get_ports {enet0_gmii_txd[0]}]

set_property DRIVE 8 [get_ports MDIO_ETHERNET_0_0_mdc]
set_property DRIVE 8 [get_ports MDIO_ETHERNET_0_0_mdio_io]

set_property DRIVE 8 [get_ports {ENET0_GMII_TX_EN_0[0]}]
set_property DRIVE 8 [get_ports {enet0_gmii_txd[3]}]
set_property DRIVE 8 [get_ports {enet0_gmii_txd[2]}]
set_property DRIVE 8 [get_ports {enet0_gmii_txd[1]}]
set_property DRIVE 8 [get_ports {enet0_gmii_txd[0]}]
