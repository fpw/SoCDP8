-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity tc08 is
    port (
        clk: in std_logic;
        rstn: in std_logic;

        enable: in std_logic;

        reg_sel: in std_logic_vector(3 downto 0);
        reg_out: out std_logic_vector(15 downto 0);
        reg_in: in std_logic_vector(15 downto 0);
        reg_write: in std_logic;

        iop: in io_state;
        io_mb: in std_logic_vector(11 downto 0);
        io_ac: in std_logic_vector(11 downto 0);
        
        io_skip: out std_logic;
        io_ac_clear: out std_logic;
        io_bus_out: out std_logic_vector(11 downto 0);
        
        pdp8_irq: out std_logic;
        soc_attention: out std_logic
    );
end tc08;

architecture Behavioral of tc08 is
    signal iop_last: io_state;
    signal regA: std_logic_vector(15 downto 0);
    signal regB: std_logic_vector(15 downto 0);
    signal regC: std_logic_vector(15 downto 0);
begin

with reg_sel select reg_out <=
    -- 0 is used for dev type outside
    regA when x"1",
    regB when x"2",
    regC when x"3",
    x"0000" when others;

iop_last <= iop when rising_edge(clk);

tc08_proc: process
begin
    wait until rising_edge(clk);
 
    if reg_write = '1' then
        case reg_sel is
            when x"1" => regA <= reg_in;
            when x"2" => regB <= reg_in;
            when x"3" => regC <= reg_in;
            when others => null;
        end case;
    end if;
    
    if iop = IO_NONE or enable = '0' then
        io_skip <= '0';
        io_ac_clear <= '0';
        io_bus_out <= (others => '0');
    end if;

    if enable = '1'  then
        if unsigned(regB(11 downto 0) and o"7707") /= 0 and regA(2) = '1' then
            pdp8_irq <= '1';
        else
            pdp8_irq <= '0';
        end if;
        soc_attention <= regC(0);

        if iop_last /= iop and io_mb(8 downto 3) = o"76" then
            -- status register A:
            -- 11 downto 9: transport unit
            --           8: motion, 0 = forward, 1 = reverse
            --           7: motion, 0 = stop, 1 = start
            --           6: mode, 0 = normal, 1 = continuous
            --  5 downto 3: function, 0 = move, 1 = search, 2 = read, 3 = read all, 4 = write, 5 = write all, 6 = write timing, 7 = unused
            --           2: enable interrupt, 0 = disable interrupt, 1 = enable interrupt
            --           1: error clear, 0 = clear all error flags, 1 = leave error flags
            --           0: dectape clear, 0 = clear dectape flag, 1 = leave dectape flag 
            case iop is
                when IO1 =>
                    -- DTRA: Put status register A on bus
                    io_bus_out <= regA(11 downto 0);
                when IO2 => 
                    -- DTCA: Clear status register A
                    regA <= (others => '0');
                when IO4 =>
                    -- DTXA: xor status register A (0 to 9 in DEC bit order), clear AC
                    regA(11 downto 2) <= regA(11 downto 2) xor io_ac(11 downto 2);
                    
                    if io_ac(1) = '0' then
                        -- clear error flags
                        regB(11 downto 6) <= (others => '0');
                    end if;
                    
                    if io_ac(0) = '0' then
                        -- clear DECtape flag
                        regB(0) <= '0';
                    end if;
                    
                    io_ac_clear <= '1';

                    -- notify SoC
                    regC(0) <= '1';
                when others => null;
            end case;
        elsif iop_last /= iop and io_mb(8 downto 3) = o"77" then
            -- status register B
            -- 11: error flag (EF)
            -- 10: mark track error (MK TRK)
            --  9: end of tape (END)
            --  8: select errror (SE)
            --  7: parity error (PE)
            --  6: timing error (TIM)
            --  5 downto 3: memory field (MF)
            --  2 downto 1: unused
            --  0: dectape flag (DTF)
            case iop is
                when IO1 =>
                    -- DTSF: Skip on flags
                    if unsigned(regB(11 downto 0) and o"7707") /= 0 then
                        io_skip <= '1';
                    end if;
                when IO2 => 
                    -- DTRB: Read status register B
                    io_bus_out <= regB(11 downto 0);
                when IO4 =>
                    -- DTLB: Load memory field
                    io_ac_clear <= '1';
                    regB(5 downto 3) <= io_ac(5 downto 3);
                when others => null;
            end case;
        end if;
    end if;

    if rstn = '0' then
        regA <= (others => '0');
        regB <= (others => '0');
        regC <= (others => '0');
    end if;
end process;

end Behavioral;
