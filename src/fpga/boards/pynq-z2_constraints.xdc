set_property BITSTREAM.GENERAL.COMPRESS TRUE [current_design]
set_property BITSTREAM.CONFIG.UNUSEDPIN PULLUP [current_design]

# Raspberry Pi connector
# Column pins
set_property -dict {PACKAGE_PIN V6 PULLUP true IOSTANDARD LVCMOS33}  [get_ports {column[0]}];   # GPIO14 - Pin  8 - TX - Col1
set_property -dict {PACKAGE_PIN Y6 PULLUP true IOSTANDARD LVCMOS33}  [get_ports {column[1]}];   # GPIO15 - Pin 10 - RX - Col2
set_property -dict {PACKAGE_PIN Y18 PULLUP true IOSTANDARD LVCMOS33} [get_ports {column[2]}];   # GPIO04 - Pin  7 - Col3
set_property -dict {PACKAGE_PIN Y19 PULLUP true IOSTANDARD LVCMOS33} [get_ports {column[3]}];   # GPIO05 - Pin 29 - Col4
set_property -dict {PACKAGE_PIN U18 PULLUP true IOSTANDARD LVCMOS33} [get_ports {column[4]}];   # GPIO06 - Pin 31 - Col5
set_property -dict {PACKAGE_PIN U19 PULLUP true IOSTANDARD LVCMOS33} [get_ports {column[5]}];   # GPIO07 - Pin 26 - Col6
set_property -dict {PACKAGE_PIN F19 PULLUP true IOSTANDARD LVCMOS33} [get_ports {column[6]}];   # GPIO08 - Pin 24 - Col7
set_property -dict {PACKAGE_PIN V10 PULLUP true IOSTANDARD LVCMOS33} [get_ports {column[7]}];   # GPIO09 - Pin 21 - Col8
set_property -dict {PACKAGE_PIN V8 PULLUP true IOSTANDARD LVCMOS33}  [get_ports {column[8]}];   # GPIO10 - Pin 19 - Col9
set_property -dict {PACKAGE_PIN W10 PULLUP true IOSTANDARD LVCMOS33} [get_ports {column[9]}];   # GPIO11 - Pin 23 - Col10
set_property -dict {PACKAGE_PIN B20 PULLUP true IOSTANDARD LVCMOS33} [get_ports {column[10]}];  # GPIO12 - Pin 32 - Col11
set_property -dict {PACKAGE_PIN W8 PULLUP true IOSTANDARD LVCMOS33}  [get_ports {column[11]}];  # GPIO13 - Pin 33 - Col12
# Switch row pins
set_property -dict {PACKAGE_PIN B19 IOSTANDARD LVCMOS33} [get_ports {switch_row[0]}];           # GPIO16 - Pin 36 - Row1
set_property -dict {PACKAGE_PIN U7 IOSTANDARD LVCMOS33}  [get_ports {switch_row[1]}];           # GPIO17 - Pin 11 - Row2
set_property -dict {PACKAGE_PIN C20 IOSTANDARD LVCMOS33} [get_ports {switch_row[2]}];           # GPIO18 - Pin 12 - Row2
# LED row pins
set_property -dict {PACKAGE_PIN A20 IOSTANDARD LVCMOS33} [get_ports {led_row[0]}];              # GPIO20 - Pin 38 - LedRow1
set_property -dict {PACKAGE_PIN Y9 IOSTANDARD LVCMOS33}  [get_ports {led_row[1]}];              # GPIO21 - Pin 40 - LedRow2
set_property -dict {PACKAGE_PIN U8 IOSTANDARD LVCMOS33}  [get_ports {led_row[2]}];              # GPIO22 - Pin 15 - LedRow3
set_property -dict {PACKAGE_PIN W6 IOSTANDARD LVCMOS33}  [get_ports {led_row[3]}];              # GPIO23 - Pin 16 - LedRow4
set_property -dict {PACKAGE_PIN Y7 IOSTANDARD LVCMOS33}  [get_ports {led_row[4]}];              # GPIO24 - Pin 18 - LedRow5
set_property -dict {PACKAGE_PIN F20 IOSTANDARD LVCMOS33} [get_ports {led_row[5]}];              # GPIO25 - Pin 22 - LedRow6
set_property -dict {PACKAGE_PIN W9 IOSTANDARD LVCMOS33}  [get_ports {led_row[6]}];              # GPIO26 - Pin 37 - LedRow7
set_property -dict {PACKAGE_PIN V7 IOSTANDARD LVCMOS33}  [get_ports {led_row[7]}];              # GPIO27 - Pin 13 - LedRow8

# Unused on Raspberry Pi connector
#set_property -dict { PACKAGE_PIN W18   IOSTANDARD LVCMOS33 } [get_ports { rpio_02_r }];        # GPIO02 - Pin  3 - Col1a
#set_property -dict { PACKAGE_PIN W19   IOSTANDARD LVCMOS33 } [get_ports { rpio_03_r }];        # GPIO03 - Pin  5 - Col2a
#set_property -dict { PACKAGE_PIN Y8    IOSTANDARD LVCMOS33 } [get_ports { rpio_19_r }];        # GPIO19 - Pin 35 - SpareIO
#set_property -dict { PACKAGE_PIN Y16   IOSTANDARD LVCMOS33 } [get_ports { rpio_sd_r }];        # GPIO00 - Pin 27 - Unconnected
#set_property -dict { PACKAGE_PIN Y17   IOSTANDARD LVCMOS33 } [get_ports { rpio_sc_r }];        # GPIO01 - Pin 28 - Unconnected

# PmodB
# 1: ASR-33
set_property -dict { PACKAGE_PIN V16   IOSTANDARD LVCMOS33 } [get_ports { uart_cts[0] }];
set_property -dict { PACKAGE_PIN W16 PULLDOWN true  IOSTANDARD LVCMOS33 } [get_ports { uart_rts[0] }];
set_property -dict { PACKAGE_PIN V12 PULLDOWN true  IOSTANDARD LVCMOS33 } [get_ports { uart_rx[0] }];
set_property -dict { PACKAGE_PIN W13   IOSTANDARD LVCMOS33 } [get_ports { uart_tx[0] }];

# 2: PC04
set_property -dict { PACKAGE_PIN W14   IOSTANDARD LVCMOS33 } [get_ports { uart_cts[1] }];
set_property -dict { PACKAGE_PIN Y14 PULLDOWN true  IOSTANDARD LVCMOS33 } [get_ports { uart_rts[1] }];
set_property -dict { PACKAGE_PIN T11 PULLDOWN true  IOSTANDARD LVCMOS33 } [get_ports { uart_rx[1] }];
set_property -dict { PACKAGE_PIN T10   IOSTANDARD LVCMOS33 } [get_ports { uart_tx[1] }];

# Arduino connector AR0 .. AR7
#set_property -dict { PACKAGE_PIN T14   IOSTANDARD LVCMOS33 } [get_ports { uart_rx[0] }];
#set_property -dict { PACKAGE_PIN U12   IOSTANDARD LVCMOS33 } [get_ports { uart_tx[0] }];
#set_property -dict { PACKAGE_PIN U13   IOSTANDARD LVCMOS33 } [get_ports { uart_rts[0] }];
#set_property -dict { PACKAGE_PIN V13   IOSTANDARD LVCMOS33 } [get_ports { uart_cts[0] }];
#set_property -dict { PACKAGE_PIN V15   IOSTANDARD LVCMOS33 } [get_ports { uart_rx[1] }];
#set_property -dict { PACKAGE_PIN T15   IOSTANDARD LVCMOS33 } [get_ports { uart_tx[1] }];
#set_property -dict { PACKAGE_PIN R16   IOSTANDARD LVCMOS33 } [get_ports { uart_rts[1] }];
#set_property -dict { PACKAGE_PIN U17   IOSTANDARD LVCMOS33 } [get_ports { uart_cts[1] }];


# HDMI Out
#set_property -dict { PACKAGE_PIN G15   IOSTANDARD LVCMOS33 } [get_ports { hdmi_tx_cec }];
#set_property -dict { PACKAGE_PIN L17   IOSTANDARD TMDS_33  } [get_ports { TMDS_clk_n }];
#set_property -dict { PACKAGE_PIN L16   IOSTANDARD TMDS_33  } [get_ports { TMDS_clk_p }];
#set_property -dict { PACKAGE_PIN K18   IOSTANDARD TMDS_33  } [get_ports { TMDS_data_n[0] }];
#set_property -dict { PACKAGE_PIN K17   IOSTANDARD TMDS_33  } [get_ports { TMDS_data_p[0] }];
#set_property -dict { PACKAGE_PIN J19   IOSTANDARD TMDS_33  } [get_ports { TMDS_data_n[1] }];
#set_property -dict { PACKAGE_PIN K19   IOSTANDARD TMDS_33  } [get_ports { TMDS_data_p[1] }];
#set_property -dict { PACKAGE_PIN H18   IOSTANDARD TMDS_33  } [get_ports { TMDS_data_n[2] }];
#set_property -dict { PACKAGE_PIN J18   IOSTANDARD TMDS_33  } [get_ports { TMDS_data_p[2] }];
#set_property -dict { PACKAGE_PIN R19   IOSTANDARD LVCMOS33 } [get_ports { hdmi_tx_hpdn }];


# Board LEDs
#set_property -dict {PACKAGE_PIN R14 IOSTANDARD LVCMOS33} [get_ports {board_led[0]}];
#set_property -dict {PACKAGE_PIN P14 IOSTANDARD LVCMOS33} [get_ports {board_led[1]}];
#set_property -dict {PACKAGE_PIN N16 IOSTANDARD LVCMOS33} [get_ports {board_led[2]}];
#set_property -dict {PACKAGE_PIN M14 IOSTANDARD LVCMOS33} [get_ports {board_led[3]}];

# Board switches
#set_property -dict { PACKAGE_PIN M20   IOSTANDARD LVCMOS33 } [get_ports { board_switch[0] }];
#set_property -dict { PACKAGE_PIN M19   IOSTANDARD LVCMOS33 } [get_ports { board_switch[1] }];

# Board RGB LEDs
#set_property -dict { PACKAGE_PIN N15   IOSTANDARD LVCMOS33 } [get_ports { board_led4_r }];
#set_property -dict { PACKAGE_PIN G17   IOSTANDARD LVCMOS33 } [get_ports { board_led4_g }];
#set_property -dict { PACKAGE_PIN L15   IOSTANDARD LVCMOS33 } [get_ports { board_led4_b }];
#set_property -dict { PACKAGE_PIN M15   IOSTANDARD LVCMOS33 } [get_ports { board_led5_r }];
#set_property -dict { PACKAGE_PIN L14   IOSTANDARD LVCMOS33 } [get_ports { board_led5_g }];
#set_property -dict { PACKAGE_PIN G14   IOSTANDARD LVCMOS33 } [get_ports { board_led5_b }];

# Board pushbuttons
#set_property -dict { PACKAGE_PIN D19   IOSTANDARD LVCMOS33 } [get_ports { board_btn[0] }];
#set_property -dict { PACKAGE_PIN D20   IOSTANDARD LVCMOS33 } [get_ports { board_btn[1] }];
#set_property -dict { PACKAGE_PIN L20   IOSTANDARD LVCMOS33 } [get_ports { board_btn[2] }];
#set_property -dict { PACKAGE_PIN L19   IOSTANDARD LVCMOS33 } [get_ports { board_btn[3] }];

# External clock
#set_property -dict {PACKAGE_PIN H16 IOSTANDARD LVCMOS33} [get_ports clk_125];
#create_clock -period 8.000 -name sys_clk_pin -waveform {0.000 4.000} -add [get_ports clk_125];
