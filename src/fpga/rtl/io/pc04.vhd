-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

entity pc04 is
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
        
        uart_rx: in std_logic;
        uart_tx: out std_logic;
        uart_cts: out std_logic;
        uart_rts: in std_logic;

        pdp8_irq: out std_logic;
        soc_attention: out std_logic
    );
end pc04;

architecture Behavioral of pc04 is
    signal iop_last: io_state;
    signal regA: std_logic_vector(15 downto 0);
    signal regB: std_logic_vector(15 downto 0);
    signal regC: std_logic_vector(15 downto 0);
    signal regD: std_logic_vector(15 downto 0);

    signal uart_tx_ready: std_logic;
    signal uart_tx_data: std_logic_vector(7 downto 0) := x"00";
    signal uart_tx_send: std_logic := '0';

    signal uart_rx_data: std_logic_vector(7 downto 0) := x"00";
    signal uart_rx_recv: std_logic;
begin

pc04_uart: entity work.uart
generic map(
    data_bits => 8,
    stop_bits => 2
)
port map(
    clk => clk,
    
    baud_cycles => baud_sel_to_cycles(regB(11 downto 9)),
    
    rx => uart_rx,
    tx => uart_tx,
    
    rts => uart_rts,
    cts => uart_cts,
    
    tx_ready => uart_tx_ready,
    tx_data => uart_tx_data,
    tx_send => uart_tx_send,

    rx_data => uart_rx_data,
    rx_recv => uart_rx_recv
    
);

with reg_sel select reg_out <=
    -- 0 is used for dev enable outside
    regA when x"1",
    regB when x"2",
    regC when x"3",
    regD when x"4",
    x"0000" when others;

pdp8_irq <= regB(1) or regD(1) when enable = '1' else '0';
soc_attention <= regB(0) or regD(0) when enable = '1' else '0';
iop_last <= iop when rising_edge(clk);

tc04_proc: process
begin
    wait until rising_edge(clk);
 
    -- defaults 
    uart_tx_send <= '0';
    
    if uart_rx_recv = '1' then
        uart_cts <= '1';
        regB(1) <= '1';
        regA(11 downto 8) <= (others => '0');
        regA(7 downto 0) <= uart_rx_data;
    end if;

    if reg_write = '1' then
        case reg_sel is
            when x"1" => regA <= reg_in;
            when x"2" => regB <= reg_in;
            when x"3" => regC <= reg_in;
            when x"4" => regD <= reg_in;
            when others => null;
        end case;
    end if;
    
    if iop = IO_NONE or enable = '0' then
        io_skip <= '0';
        io_ac_clear <= '0';
        io_bus_out <= (others => '0');
    end if;

    if enable = '1' and iop_last /= iop and io_mb(8 downto 3) = o"01" then
        -- Reader interface: Write new data into regA if regB & 1,then set regB to 2
        case iop is
            when IO1 =>
                -- Set skip if new data
                io_skip <= regB(1);
            when IO2 => 
                -- Clear new data flag, put data on bus
                io_bus_out <= regA(11 downto 0);
                regB(1) <= '0';
            when IO4 =>
                -- Clear flag, request new data
                regB(0) <= '1';
                regB(1) <= '0';
                uart_cts <= '0';
            when others => null;
        end case;
    elsif enable = '1' and iop_last /= iop and io_mb(8 downto 3) = o"02" then
        -- Writer interface: Check regD = 1 to see if new data, take from regC and set regD to 2 to ack
        case iop is
            when IO1 =>
                -- Set skip if data acked
                io_skip <= regD(1) and uart_tx_ready;
            when IO2 =>
                -- Clear ack flag 
                regD(1) <= '0';
            when IO4 => 
                -- Load buffer
                regC(11 downto 0) <= io_ac;
                regD(0) <= '1';
                
                uart_tx_data <= io_ac(7 downto 0);
                uart_tx_send <= '1';
            when others => null;
        end case;
    end if;

    if rstn = '0' then
        uart_cts <= '0';
        regA <= (others => '0');
        regB <= (others => '0');
        regC <= (others => '0');
        regD <= (others => '0');
    end if;
end process;

end Behavioral;
