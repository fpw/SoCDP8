-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

package pidp8_console_package is
    type lamp_brightness_array is array(natural range<>) of natural range 0 to 31;
end pidp8_console_package;

package body pidp8_console_package is
end package body;