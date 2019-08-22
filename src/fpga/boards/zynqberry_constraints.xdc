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
# GPIO14 - Pin 8 - TX = Col1
set_property PACKAGE_PIN M12 [get_ports {column[0]}]
# GPIO15 - Pin 10 - RX = Col2
set_property PACKAGE_PIN N13 [get_ports {column[1]}]
# GPIO4 - Pin 7 - Col3
set_property PACKAGE_PIN H12 [get_ports {column[2]}]
# GPIO5 - Pin 29 - Col4
set_property PACKAGE_PIN N14 [get_ports {column[3]}]
# GPIO6 - Pin 31 - Col5
set_property PACKAGE_PIN R15 [get_ports {column[4]}]
# GPIO7 - Pin 26 - Col6
set_property PACKAGE_PIN L14 [get_ports {column[5]}]
# GPIO8 - Pin 24 - Col7
set_property PACKAGE_PIN L15 [get_ports {column[6]}]
# GPIO9 - Pin 21 - Col8
set_property PACKAGE_PIN J13 [get_ports {column[7]}]
# GPIO10 - Pin 19 - Col9
set_property PACKAGE_PIN H14 [get_ports {column[8]}]
# GPIO11 - Pin 23 - Col10
set_property PACKAGE_PIN J15 [get_ports {column[9]}]
# GPIO12 - Pin 32 - Col11
set_property PACKAGE_PIN M15 [get_ports {column[10]}]
# GPIO13 - Pin 33 - Col12
set_property PACKAGE_PIN R13 [get_ports {column[11]}]

# Switch row pins
set_property IOSTANDARD LVCMOS33 [get_ports {switch_row[*]}]
set_property PULLUP false [get_ports {switch_row[*]}]
# GPIO16 - Pin 36 - SwitchRow1
set_property PACKAGE_PIN L13 [get_ports {switch_row[0]}]
# GPIO17 - Pin 11 - SwitchRow2
set_property PACKAGE_PIN G11 [get_ports {switch_row[1]}]
# GPIO18 - Pin 12 - SwitchRow3
set_property PACKAGE_PIN H11 [get_ports {switch_row[2]}]

# LED row pins
set_property IOSTANDARD LVCMOS33 [get_ports {led_row[*]}]
# GPIO20 - Pin 38 - LedRow1
set_property PACKAGE_PIN M14 [get_ports {led_row[0]}]
# GPIO21 - Pin 40 - LedRow2
set_property PACKAGE_PIN P15 [get_ports {led_row[1]}]
# GPIO22 - Pin 15 - LedRow3
set_property PACKAGE_PIN H13 [get_ports {led_row[2]}]
# GPIO23 - Pin 16 - LedRow4
set_property PACKAGE_PIN J11 [get_ports {led_row[3]}]
# GPIO24 - Pin 18 - LedRow5
set_property PACKAGE_PIN K11 [get_ports {led_row[4]}]
# GPIO25 - Pin 22 - LedRow6
set_property PACKAGE_PIN K13 [get_ports {led_row[5]}]
# GPIO26 - Pin 37 - LedRow7
set_property PACKAGE_PIN L12 [get_ports {led_row[6]}]
# GPIO27 - Pin 13 - LedRow8
set_property PACKAGE_PIN G12 [get_ports {led_row[7]}]
