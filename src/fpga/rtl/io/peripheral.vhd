-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity peripheral is
    generic (
        clk_frq: natural;
        dev_index: natural
    );
    port (
        clk: in std_logic;
        rstn: in std_logic;

        signal dev_type: in std_logic_vector(15 downto 0);

        signal reg_sel: in std_logic_vector(3 downto 0);
        signal reg_out: out std_logic_vector(15 downto 0);
        signal reg_in: in std_logic_vector(15 downto 0);
        signal reg_write: in std_logic;

        signal enable: in std_logic;
        signal iop: in io_state;
        signal io_mb: in std_logic_vector(11 downto 0);
        signal io_ac: in std_logic_vector(11 downto 0);
        
        signal io_skip: out std_logic;
        signal io_ac_clear: out std_logic;
        signal io_bus_out: out std_logic_vector(11 downto 0);
        
        signal pdp8_irq: out std_logic
    );
end peripheral;

architecture Behavioral of peripheral is
    signal devType: std_logic_vector(15 downto 0);
    signal regA: std_logic_vector(15 downto 0);
    signal regB: std_logic_vector(15 downto 0);
    signal regC: std_logic_vector(15 downto 0);
    signal regD: std_logic_vector(15 downto 0);
    
    signal pdp8_irq_buf: std_logic;
begin

with reg_sel select reg_out <=
    -- 0 is used for dev type outside
    regA when x"1",
    regB when x"2",
    regC when x"3",
    regD when x"4",
    x"0000" when others;

pdp8_irq <= pdp8_irq_buf;

action: process
    procedure asr33_reader is
    begin
        -- Interface: Write new data into regA and then set regB to 1
        pdp8_irq_buf <= regB(0);
        if enable = '1' then
            case iop is
                when IO1 =>
                    -- Set skip if new data
                    io_skip <= regB(0);
                when IO2 => 
                    -- Clear AC, clear new data flag
                    io_ac_clear <= '1';
                    regB(0) <= '0';
                when IO4 => 
                    -- Put data on bus
                    io_bus_out <= regA(11 downto 0);
                when others => null;
            end case;
        end if;
    end procedure;
    
    procedure asr33_writer is
    begin
        -- Interface: Check regB = 1 to see if new data, take from regA and set regB to 2 to ack
        pdp8_irq_buf <= regB(1);
        if enable = '1' then
            case iop is
                when IO1 =>
                    -- Set skip if data acked
                    io_skip <= regB(1);
                when IO2 =>
                    -- Clear ack flag 
                    regB(1) <= '0';
                when IO4 => 
                    -- Load buffer
                    regA(11 downto 0) <= io_ac;
                    regB(0) <= '1';
                when others => null;
            end case;
        end if;
    end procedure;

    procedure pr8_reader is
    begin
        -- Interface: Write new data into regA and then set regB to 1
        pdp8_irq_buf <= regB(0);
        if enable = '1' then
            case iop is
                when IO1 =>
                    -- Set skip if new data
                    io_skip <= regB(0);
                when IO2 => 
                    -- Clear new data flag, put data on bus
                    io_bus_out <= regA(11 downto 0);
                    regB(0) <= '0';
                when IO4 =>
                    null; 
                when others => null;
            end case;
        end if;
    end procedure;
begin
    wait until rising_edge(clk);
 
    if reg_write = '1' then
        case reg_sel is
            when x"1" => regA <= reg_in;
            when x"2" => regB <= reg_in;
            when x"3" => regC <= reg_in;
            when x"4" => regD <= reg_in;
            when others => null;
        end case;
    end if;
    
    io_skip <= '0';
    io_ac_clear <= '0';
    io_bus_out <= (others => '0');
    
    case dev_type is
        when x"0001" => asr33_reader;
        when x"0002" => asr33_writer;
        when x"0003" => pr8_reader;
        when others => null;
    end case;

    if rstn = '0' then
        regA <= (others => '0');
        regB <= (others => '0');
        regC <= (others => '0');
        regD <= (others => '0');
    end if;
end process;

end Behavioral;
