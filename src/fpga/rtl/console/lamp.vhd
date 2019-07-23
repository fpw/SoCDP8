-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;
use work.pidp8_console_package.all;

entity lamp is
    generic (
        clk_frq: natural;
        lamp_count: natural;
        rise_time_ms: natural;
        -- we want to use 32 levels for the brightness, rising in given time
        cycles_max: natural := period_to_cycles(clk_frq, real(rise_time_ms) * 1.0e-3 / 32.0)
    );
    port (
        clk: in std_logic;
        rst: in std_logic;
        input: in std_logic_vector(lamp_count - 1 downto 0);
        brightness: out lamp_brightness_array(0 to lamp_count - 1)
    );
end lamp;

architecture Behavioral of lamp is
    signal cycle_counter: natural range 0 to cycles_max - 1;
    signal update_brightness: std_logic;
begin

count: process
begin
    wait until rising_edge(clk);

    update_brightness <= '0';

    if cycle_counter < cycles_max - 1 then
        cycle_counter <= cycle_counter + 1;
    else
        cycle_counter <= 0;
        update_brightness <= '1';
    end if;

    if rst = '1' then
        cycle_counter <= 0;
    end if;
end process;

calc_brightness: process
begin
    wait until rising_edge(clk) and update_brightness = '1';
    
    for i in 0 to lamp_count - 1 loop
        if input(i) = '1' then
            if brightness(i) < 31 then
                brightness(i) <= brightness(i) + 1;
            end if;
        else
            if brightness(i) > 0 then
                brightness(i) <= brightness(i) - 1;
            end if;
        end if;
    end loop;

    if rst = '1' then
        for i in 0 to lamp_count - 1 loop
            brightness(i) <= 0;
        end loop;
    end if;
end process;

end Behavioral;