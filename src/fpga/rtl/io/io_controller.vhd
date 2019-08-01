-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

-- The I/O controller implements an interface between an AXI bus and the PDP-8/I.
entity io_controller is
    generic(
        -- AXI parameters
        C_S_AXI_DATA_WIDTH: natural := 32;
        C_S_AXI_ADDR_WIDTH: integer := 8
    );
    port (
        -- AXI
        S_AXI_ACLK: in std_logic;
        S_AXI_ARESETN: in std_logic;
        
        --- Read address channel: Master initiates read transaction
        S_AXI_ARADDR: in std_logic_vector(C_S_AXI_ADDR_WIDTH - 1 downto 0);
        S_AXI_ARVALID: in std_logic;
        S_AXI_ARREADY: out std_logic; 

        --- Read data channel: Slave outputs data
        S_AXI_RDATA: out std_logic_vector(C_S_AXI_DATA_WIDTH - 1 downto 0);
        S_AXI_RVALID: out std_logic;
        S_AXI_RREADY: in std_logic;
        S_AXI_RRESP: out std_logic_vector(1 downto 0); -- 00 := OKAY, 10 := RETRY

        --- Write address channel: Master initiates write transaction
        S_AXI_AWADDR: in std_logic_vector(C_S_AXI_ADDR_WIDTH - 1 downto 0);
        S_AXI_AWVALID: in std_logic;
        S_AXI_AWREADY: out std_logic;
        
        --- Write data channel: Master writes data
        S_AXI_WDATA: in std_logic_vector(C_S_AXI_DATA_WIDTH - 1 downto 0);
        S_AXI_WVALID: in std_logic;
        S_AXI_WREADY: out std_logic;
        S_AXI_WSTRB: in std_logic_vector((C_S_AXI_DATA_WIDTH / 8) - 1 downto 0); -- byte select
        
        --- Write acknowledge channel: Slave acknowledges receipt
        S_AXI_BVALID: out std_logic;
        S_AXI_BREADY: in std_logic;
        S_AXI_BRESP: out std_logic_vector(1 downto 0); -- 00 := OKAY, 10 := RETRY
        

        -- I/O connections to PDP-8
        iop: in std_logic_vector(2 downto 0);
        io_ac: in std_logic_vector(11 downto 0);
        io_mb: in std_logic_vector(11 downto 0);
        io_bus_out: out std_logic_vector(11 downto 0);
        io_ac_clear: out std_logic;
        io_skip: out std_logic;
        
        -- The I/O controller generates an interrupt whenever a device has a pending transfer.
        -- Address 0 can be read to see which of the devices is pending.
        irq: out std_logic
    );

    constant clk_frq: natural := 50_000_000;
end io_controller;

architecture Behavioral of io_controller is
    type axi_state is (IDLE, READ, WRITE);
    signal state: axi_state;
    
    signal device_addr: std_logic_vector(5 downto 0);
    
    signal tty_reader_data: std_logic_vector(7 downto 0);
    signal tty_reader_ready: std_logic;
    signal tty_reader_data_offer: std_logic_vector(7 downto 0);
    signal tty_reader_take_data: std_logic;
    
    signal tty_punch_data: std_logic_vector(7 downto 0);
    signal tty_punch_done: std_logic;
    signal tty_punch_take_data: std_logic;
    signal tty_punch_ack_data: std_logic;
begin

tty_reader: process
begin
    wait until rising_edge(S_AXI_ACLK);

    io_skip <= '0';
    io_ac_clear <= '0';
    io_bus_out <= o"0000";
    
    irq <= '0';

    case to_integer(unsigned(io_mb(8 downto 3))) is
        when 3 =>
            -- TTY reader
            if iop(0) = '1' then
                -- IOP1: Skip if ready
                io_skip <= tty_reader_ready;
            elsif iop(1) = '1' then
                -- IOP2: Clear ready flag and AC
                tty_reader_ready <= '0';
                io_ac_clear <= '1';
                irq <= '1';
            elsif iop(2) = '1' then
                -- IOP4: Read data
                io_bus_out(11 downto 8) <= "0000";
                io_bus_out(7 downto 0) <= tty_reader_data;
            end if;
        when 4 =>
            -- TTY punch
            if iop(0) = '1' then
                -- IOP1: Skip if ready
                io_skip <= tty_punch_done;
            elsif iop(1) = '1' then
                -- IOP2: Clear done flag
                tty_punch_done <= '0';
            elsif iop(2) = '1' then
                -- IOP4: Write data (unless already doing that)
                if tty_punch_take_data = '0' then
                    tty_punch_data <= io_ac(7 downto 0);
                    tty_punch_take_data <= '1';
                    irq <= '1';
                end if;
            end if;
        when others =>
            null;
    end case;

    if tty_reader_take_data = '1' then
        tty_reader_data <= tty_reader_data_offer;
        tty_reader_ready <= '1';
    end if;
    
    if tty_punch_ack_data = '1' then
        tty_punch_take_data <= '0';
        tty_punch_done <= '1';
    end if;
    
    if s_axi_aresetn = '0' then
        tty_reader_ready <= '0';
        tty_reader_data <= (others => '0');

        tty_punch_take_data <= '0';        
        tty_punch_data <= (others => '0');
        tty_punch_done <= '0';
    end if;
end process;

axi_fsm: process
begin
    wait until rising_edge(S_AXI_ACLK);

    --- Address channels
    S_AXI_ARREADY <= '0';
    S_AXI_AWREADY <= '0';
    S_AXI_WREADY <= '0';

    --- Read data channel
    S_AXI_RDATA <= (others => '0');
    S_AXI_RRESP <= "10";
    S_AXI_RVALID <= '0';
   
    --- Write ack channel
    S_AXI_BRESP <= "10";
    S_AXI_BVALID <= '0';
    
    --- TTY data
    tty_reader_take_data <= '0';
    tty_punch_ack_data <= '0';

    case state is
        when IDLE =>
            if s_axi_arvalid = '1' then
                device_addr <= s_axi_araddr(C_S_AXI_ADDR_WIDTH - 1 downto 2);
                s_axi_arready <= '1';
                state <= READ;
            elsif s_axi_awvalid = '1' and s_axi_wvalid = '1' then
                device_addr <= s_axi_awaddr(C_S_AXI_ADDR_WIDTH - 1 downto 2);
                s_axi_awready <= '1';
                s_axi_wready <= '1';
                state <= WRITE;
            end if;
        when READ =>
            -- write answer
            case to_integer(unsigned(device_addr)) is
                when 0 => -- Status register
                    s_axi_rdata <= (
                        3 => not tty_reader_ready,
                        4 => tty_punch_take_data,
                        others => '0'
                    );
                when 3 => -- TTY reader
                    s_axi_rdata(31 downto 9) <= (others => '0');
                    s_axi_rdata(8) <= tty_reader_ready;
                    s_axi_rdata(7 downto 0) <= tty_reader_data;
                when 4 => -- TTY punch
                    s_axi_rdata(31 downto 9) <= (others => '0');
                    s_axi_rdata(8) <= tty_punch_take_data;
                    s_axi_rdata(7 downto 0) <= tty_punch_data;
                when others =>
                    s_axi_rdata <= (others => '0');
            end case;
            s_axi_rresp <= "00";
            s_axi_rvalid <= '1';

            -- check if answer received
            if s_axi_rready = '1' then
                state <= IDLE;
            end if;
        when WRITE =>
            -- accept data
            case to_integer(unsigned(device_addr)) is
                when 3 => -- TTY reader
                    if s_axi_wstrb(0) = '1' then
                        tty_reader_data_offer <= s_axi_wdata(7 downto 0);
                        if s_axi_bready = '1' then
                            tty_reader_take_data <= '1';
                        end if;
                    end if;
                when 4 => -- TTY punch
                    if s_axi_wstrb(1) = '1' then
                        if s_axi_bready = '1' then
                            tty_punch_ack_data <= '1';
                        end if;
                    end if;
                when others => null;
            end case;
            s_axi_bresp <= "00";
            s_axi_bvalid <= '1';
            
            -- check if transaction accepted
            if s_axi_bready = '1' then
                state <= IDLE;
            end if;
    end case;
    
    if s_axi_aresetn = '0' then
        state <= IDLE;
        tty_reader_data_offer <= (others => '0');
        tty_reader_take_data <= '0';
    end if;
end process;

end Behavioral;
