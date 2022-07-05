-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity lamp is
    generic (
        lamp_count: natural;
        rise_time_ms: natural := 100
    );
    port (
        clk: in std_logic;
        rstn: in std_logic;
        input: in std_logic_vector(lamp_count - 1 downto 0);
        brightness: out lamp_brightness_array(0 to lamp_count - 1)
    );
    
    -- Theory: The fastest refresh rate for the lamps is auto_cycle_time_ns, so we should sample each lamp signal
    -- twice as fast to avoid aliasing, e.g. 125 ns
    constant sample_rate: real := real(auto_cycle_time_ns) * 1.0e-9 / 2.0;
    
    -- We have 16 levels of brightness, so we need to divide our rise time by this to know how often to update the brightness level,
    -- e.g. 6.25 ms
    constant update_rate: real := real(rise_time_ms) * 1.0e-3 / 16.0;

    -- Thus, we need update_rate / sample_rate samples before updating the level,
    -- e.g. 50,000
    constant num_samples: natural := natural(update_rate / sample_rate);

    -- And we need n cycles until we need to collect a new sample, e.g. 6 cycles
    constant num_cycles: natural := period_to_cycles(clk_frq, sample_rate) - 1;
end lamp;

architecture Behavioral of lamp is
    signal cycle_counter: natural range 0 to num_cycles - 1;
    
    signal brightness_int: lamp_brightness_array(0 to lamp_count - 1);
    
    type sample_array is array(0 to lamp_count - 1) of natural range 0 to num_samples - 1;
    signal samples: sample_array;
    signal sample_num: natural range 0 to num_samples - 1;
    
    function rise_brightness(cur: in unsigned) return unsigned is
        type rise_array is array(0 to 15) of natural;
        -- filter output when current level 0  1  2  3  4  5  6  7  8   9  10  11  12  13  14  15
        constant rise_table: rise_array := (4, 4, 4, 4, 7, 7, 7, 9, 9, 10, 11, 12, 13, 14, 15, 15);
    begin
        return to_unsigned(rise_table(to_integer(cur)), 4);
    end function;

    function lower_brightness(cur: in unsigned) return unsigned is
        type rise_array is array(0 to 15) of natural;
        -- filter output when current level 15  14  13  12  11  10  9  8  7  6  5  4  3  2  1  0
        constant rise_table: rise_array := (12, 12, 12, 10, 10,  8, 8, 6, 6, 5, 4, 3, 2, 1, 0, 0);
    begin
        return to_unsigned(rise_table(15 - to_integer(cur)), 4);
    end function;

begin

-- count sample rate, e.g. counter is 0 every 120 ns
count: process
begin
    wait until rising_edge(clk);

    if cycle_counter < num_cycles - 1 then
        cycle_counter <= cycle_counter + 1;
    else
        cycle_counter <= 0;
    end if;

    if rstn = '0' then
        cycle_counter <= 0;
    end if;
end process;

-- triggered every 120 ns
calc_brightness: process
begin
    wait until rising_edge(clk) and cycle_counter = 0;

    -- collect samples for 6 ms
    for i in 0 to lamp_count - 1 loop
        if input(i) = '1' then
            samples(i) <= samples(i) + 1;
        end if;
    end loop;

    -- check if time passed and calculate response
    if sample_num < num_samples - 1 then
        sample_num <= sample_num + 1;
    else
        for i in 0 to lamp_count - 1 loop
            -- TODO: Rise the brightness depending on the accumulated on time
            if samples(i) > 25 then
                -- some samples were 1: increase brightness
                brightness_int(i) <= rise_brightness(brightness_int(i));
            else
                -- not enough samples were 1: decrease brightness
                brightness_int(i) <= lower_brightness(brightness_int(i));
            end if;
            samples(i) <= 0;
        end loop;
        sample_num <= 0;
    end if;

    if rstn = '0' then
        for i in 0 to lamp_count - 1 loop
            brightness_int(i) <= (others => '0');
        end loop;
        sample_num <= 0;
    end if;
end process;

output: for i in 0 to lamp_count - 1 generate  
    brightness(i) <= brightness_int(i);
end generate;

end Behavioral;