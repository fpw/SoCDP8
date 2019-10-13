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
        C_S_AXI_ADDR_WIDTH: integer := 9
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
        S_AXI_RDATA: out std_logic_vector(31 downto 0);
        S_AXI_RVALID: out std_logic;
        S_AXI_RREADY: in std_logic;
        S_AXI_RRESP: out std_logic_vector(1 downto 0); -- 00 := OKAY, 10 := RETRY

        --- Write address channel: Master initiates write transaction
        S_AXI_AWADDR: in std_logic_vector(C_S_AXI_ADDR_WIDTH - 1 downto 0);
        S_AXI_AWVALID: in std_logic;
        S_AXI_AWREADY: out std_logic;
        
        --- Write data channel: Master writes data
        S_AXI_WDATA: in std_logic_vector(31 downto 0);
        S_AXI_WVALID: in std_logic;
        S_AXI_WREADY: out std_logic;
        S_AXI_WSTRB: in std_logic_vector(3 downto 0); -- byte select
        
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
        
        -- PDP-8 interrupt line
        pdp_irq: out std_logic;
        
        -- The I/O controller generates an interrupt whenever a device has a pending transfer.
        -- Address 0 can be read to see which of the devices is pending.
        soc_irq: out std_logic
    );

    constant clk_frq: natural := 50_000_000;
end io_controller;

architecture Behavioral of io_controller is
    type axi_state is (IDLE, READ, READ_WAIT, WRITE, WRITE_ACK);
    signal state: axi_state;
    
    type state_a is array(0 to 63) of std_logic_vector(31 downto 0);
    signal dev_states: state_a;
    signal dev_flags: std_logic_vector(63 downto 0);
    
    signal iop_code: std_logic_vector(1 downto 0);
    
    signal ram_addr_io: std_logic_vector(5 downto 0);
    signal ram_in_io: std_logic_vector(31 downto 0);
    signal ram_write_io: std_logic;
    signal ram_out_io: std_logic_vector(31 downto 0);

    signal bus_addr: std_logic_vector(C_S_AXI_ADDR_WIDTH - 3 downto 0);

    signal ram_addr_axi: std_logic_vector(5 downto 0);
    signal ram_in_axi: std_logic_vector(31 downto 0);
    signal ram_write_axi: std_logic;
    signal ram_out_axi: std_logic_vector(31 downto 0);

    signal write_pending: std_logic;
    signal write_dev_id: std_logic_vector(5 downto 0);
    signal write_word: std_logic_vector(31 downto 0);    
    signal write_done: std_logic;
begin

io_ram_internal: process
begin
    wait until rising_edge(S_AXI_ACLK);
    
    if ram_write_io = '1' then
        dev_states(to_integer(unsigned(ram_addr_io))) <= ram_in_io;
    end if;
    ram_out_io <= dev_states(to_integer(unsigned(ram_addr_io)));
end process;

io_ram_axi: process
begin
    wait until rising_edge(S_AXI_ACLK);
    
    if ram_write_axi = '1' then
        dev_states(to_integer(unsigned(ram_addr_axi))) <= ram_in_axi;
    end if;
    ram_out_axi <= dev_states(to_integer(unsigned(ram_addr_axi)));
end process;

iop_code <= "01" when iop(0) = '1' else
            "10" when iop(1) = '1' else
            "11" when iop(2) = '1' else
            "00";

io_proc: process
begin
    wait until rising_edge(S_AXI_ACLK);

    -- default bus output
    io_skip <= '0';
    io_ac_clear <= '0';
    io_bus_out <= o"0000";
    
    ram_write_io <= '0';
    ram_write_axi <= '0';
    
    -- default IRQ state for SoC
    soc_irq <= '0';

    ram_addr_io <= io_mb(8 downto 3);

    if iop_code /= "00" and write_pending = '0' and ram_addr_io = io_mb(8 downto 3) then
        -- Request IRQ in current IOP (only one cycle)
        if ram_out_io(26 downto 25) = iop_code then
            soc_irq <= '1';
        end if;
        
        -- Request AC -> REG in current IOP (only one cycle)
        if ram_out_io(24 downto 23) = iop_code then
            ram_in_io <= ram_out_io;
            ram_in_io(27) <= '1';
            ram_in_io(11 downto 0) <= io_ac;
            ram_write_io <= '1';
        end if;
        
        -- Request AC CLEAR in current IOP
        if ram_out_io(22 downto 21) = iop_code then
            io_ac_clear <= '1';
        end if;
        
        -- Request REG -> AC in current IOP
        if ram_out_io(20 downto 19) = iop_code then
            io_bus_out <= ram_out_io(11 downto 0);
        end if;
        
        -- Request flag set in current IOP
        if ram_out_io(18 downto 17) = iop_code then
            dev_flags(to_integer(unsigned(io_mb(8 downto 3)))) <= '1';
        end if;
        
        -- Request flag clear in current IOP
        if ram_out_io(16 downto 15) = iop_code then
            dev_flags(to_integer(unsigned(io_mb(8 downto 3)))) <= '0';
        end if;
        
        -- Request skip on flag in current IOP
        if ram_out_io(14 downto 13) = iop_code then
            io_skip <= dev_flags(to_integer(unsigned(io_mb(8 downto 3))));
        end if;
    else
        if write_pending = '1' and write_done = '0' then
            if write_dev_id = o"00" then
                -- writing to address 0 clears the flag of the device ID that is written
                dev_flags(to_integer(unsigned(write_word(5 downto 0)))) <= '0';
            else
                if write_word(12) = '1' then
                    dev_flags(to_integer(unsigned(write_dev_id))) <= '1';
                end if;
                ram_addr_io <= write_dev_id;
                ram_in_io <= write_word;
                ram_write_io <= '1'; 
            end if;
            write_done <= '1';
        end if;
    end if;

    if write_pending = '0' then
        write_done <= '0';
    end if;

    if s_axi_aresetn = '0' then
        dev_flags <= (others => '0');
        write_done <= '0';
        ram_in_axi <= (others => '0');
    end if;
end process;

pdp_irq <= '1' when to_integer(unsigned(dev_flags)) /= 0 else '0';

axi_fsm: process
begin
    wait until rising_edge(S_AXI_ACLK);

    -- Defaults
    --- Address channels
    S_AXI_ARREADY <= '0';
    S_AXI_AWREADY <= '0';
    S_AXI_WREADY <= '0';

    --- Read data channel
    S_AXI_RDATA <= (others => '0');
    S_AXI_RRESP <= "00";
    S_AXI_RVALID <= '0';
   
    --- Write ack channel
    S_AXI_BRESP <= "00";
    S_AXI_BVALID <= '0';

    if write_done = '1' then
        write_pending <= '0';
    end if;

    case state is
        when IDLE =>
            if s_axi_arvalid = '1' then
                s_axi_arready <= '1';
                bus_addr <= s_axi_araddr(C_S_AXI_ADDR_WIDTH - 1 downto 2);
                ram_addr_axi <= s_axi_araddr(C_S_AXI_ADDR_WIDTH - 2 downto 2);
                state <= READ_WAIT;
            elsif s_axi_awvalid = '1' and s_axi_wvalid = '1' and write_pending = '0' then
                s_axi_awready <= '1';
                bus_addr <= s_axi_awaddr(C_S_AXI_ADDR_WIDTH - 1 downto 2);
                state <= WRITE;
            end if;
        when READ_WAIT =>
            -- waiting for RAM to fill register
            state <= READ;
        when READ =>
            -- write answer
            if to_integer(unsigned(bus_addr)) < 64 then
                s_axi_rdata <= ram_out_axi;
            elsif to_integer(unsigned(bus_addr)) = 64 then
                s_axi_rdata <= dev_flags(31 downto 0);
            elsif to_integer(unsigned(bus_addr)) = 65 then
                s_axi_rdata <= dev_flags(63 downto 32);
            elsif to_integer(unsigned(bus_addr)) = 66 then
                s_axi_rdata(0) <= write_pending;
            else
                s_axi_rdata <= (others => '0');
            end if;
            s_axi_rresp <= "00";
            s_axi_rvalid <= '1';
            if s_axi_rready = '1' then
                state <= IDLE;
            end if;
        when WRITE =>
            if to_integer(unsigned(bus_addr)) = 66 then
                if s_axi_wdata(0) = '1' then
                    write_word <= (others => '0');
                else
                    write_pending <= '1';
                end if;
            else
                write_dev_id <= bus_addr(5 downto 0);

                if s_axi_wstrb(0) = '1' then
                    write_word(7 downto 0) <= s_axi_wdata(7 downto 0);
                end if;
                
                if s_axi_wstrb(1) = '1' then
                    write_word(15 downto 8) <= s_axi_wdata(15 downto 8);
                end if;
                
                if s_axi_wstrb(2) = '1' then
                    write_word(23 downto 16) <= s_axi_wdata(23 downto 16);
                end if;
                
                if s_axi_wstrb(3) = '1' then
                    write_word(31 downto 24) <= s_axi_wdata(31 downto 24);
                end if;
            end if;
            s_axi_wready <= '1';
            state <= WRITE_ACK;
        when WRITE_ACK =>
            s_axi_bresp <= "00";
            s_axi_bvalid <= '1';
            if s_axi_bready = '1' then
                state <= IDLE;
            end if;
    end case;
    
    if s_axi_aresetn = '0' then
        bus_addr <= (others => '0');
        ram_addr_axi <= (others => '0');
        write_pending <= '0';
        write_dev_id <= (others => '0');
        write_word <= (others => '0');
        state <= IDLE;
    end if;
end process;

end Behavioral;
