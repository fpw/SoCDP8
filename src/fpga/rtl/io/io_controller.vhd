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
        C_S_AXI_ADDR_WIDTH: integer := 12;
        MAX_DEVICES: natural := 8
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
    type axi_state is (IDLE, READ_WAIT, READ, WRITE_WAIT, WRITE, WRITE_ACK);
    signal state: axi_state;
    signal axi_dev_id: integer range 0 to 63;
    signal axi_dev_reg: integer range 0 to 15;

    signal perph_reg_sel: std_logic_vector(3 downto 0);
    signal perph_reg_in: std_logic_vector(15 downto 0);
    signal perph_reg_write: std_logic_vector(63 downto 0);

    signal iop_code: io_state;
    signal cur_dev_id: integer range 0 to 63;
    signal dev_active: std_logic_vector(63 downto 0);
    signal dev_interrupts: std_logic_vector(63 downto 0);

    type dev_types_a is array(0 to 63) of std_logic_vector(15 downto 0);
    signal dev_types: dev_types_a;

    type peripheral_out_rec is record
        io_skip: std_logic;
        io_ac_clear: std_logic;
        io_bus_out: std_logic_vector(11 downto 0);
        reg_out: std_logic_vector(15 downto 0);
    end record;
    type peripheral_out_a is array(0 to 63) of peripheral_out_rec;
    
    signal peripheral_out: peripheral_out_a;

    function to_dev_id(addr: std_logic_vector(9 downto 0)) return integer is
    begin
        return to_integer(unsigned(addr(9 downto 4)));
    end function;

    function to_dev_reg(addr: std_logic_vector(9 downto 0)) return integer is
    begin
        return to_integer(unsigned(addr(3 downto 0)));
    end function;
begin

iop_code <= IO1 when iop(0) = '1' else
            IO2 when iop(1) = '1' else
            IO4 when iop(2) = '1' else
            IO_NONE;

pdp_irq <= '1' when to_integer(unsigned(dev_interrupts)) /= 0 else '0';
cur_dev_id <= to_integer(unsigned(io_mb(8 downto 3)));
io_skip <= peripheral_out(cur_dev_id).io_skip;
io_ac_clear <= peripheral_out(cur_dev_id).io_ac_clear;
io_bus_out <= peripheral_out(cur_dev_id).io_bus_out;

gen_peripherals: for i in 0 to 63 generate
    perph: entity work.peripheral
    generic map (
        clk_frq => clk_frq,
        dev_index => i
    )
    port map (
        clk => S_AXI_ACLK,
        rstn => s_axi_aresetn,
        
        dev_type => dev_types(i),
        
        reg_sel => perph_reg_sel,
        reg_out => peripheral_out(i).reg_out,
        reg_in => perph_reg_in,
        reg_write => perph_reg_write(i),
        
        enable => dev_active(i),
        iop => iop_code,
        io_mb => io_mb,
        io_ac => io_ac,
        
        io_skip => peripheral_out(i).io_skip,
        io_ac_clear => peripheral_out(i).io_ac_clear,
        io_bus_out => peripheral_out(i).io_bus_out,
        
        pdp8_irq => dev_interrupts(i)
    );
end generate;

io_proc: process
begin
    wait until rising_edge(S_AXI_ACLK);

    -- default signals
    soc_irq <= '0';
    dev_active <= (others => '0');

    if iop_code /= IO_NONE then
        dev_active(cur_dev_id) <= '1';
    end if;
end process;

perph_reg_sel <= std_logic_vector(to_unsigned(axi_dev_reg, 4));

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
    
    perph_reg_write <= (others => '0');

    case state is
        when IDLE =>
            if s_axi_arvalid = '1' then
                s_axi_arready <= '1';
                axi_dev_id <= to_dev_id(s_axi_araddr(11 downto 2));
                axi_dev_reg <= to_dev_reg(s_axi_araddr(11 downto 2));
                state <= READ_WAIT;
            elsif s_axi_awvalid = '1' and s_axi_wvalid = '1' then
                s_axi_awready <= '1';
                axi_dev_id <= to_dev_id(s_axi_awaddr(11 downto 2));
                axi_dev_reg <= to_dev_reg(s_axi_awaddr(11 downto 2));
                state <= WRITE_WAIT;
            end if;
        when READ_WAIT =>
            state <= READ;
        when READ =>
            -- write answer
            s_axi_rdata <= (others => '0');

            if axi_dev_id = 0 then
                case axi_dev_reg is
                    when 0 => s_axi_rdata <= dev_interrupts(31 downto 0); 
                    when 1 => s_axi_rdata <= dev_interrupts(63 downto 32);
                    when others => s_axi_rdata <= (others => '0');
                end case;
            else
                if axi_dev_reg = 0 then
                    s_axi_rdata(15 downto 0) <= dev_types(axi_dev_id);
                else
                    s_axi_rdata(15 downto 0) <= peripheral_out(axi_dev_id).reg_out;
                end if;
            end if;
            s_axi_rresp <= "00";
            s_axi_rvalid <= '1';
            if s_axi_rready = '1' then
                state <= IDLE;
            end if;
        when WRITE_WAIT =>
            if axi_dev_id /= cur_dev_id or iop_code = IO_NONE then
                state <= WRITE;
            end if;
        when WRITE =>
            if axi_dev_reg = 0 then
                if s_axi_wstrb(0) = '1' then
                    dev_types(axi_dev_id)(7 downto 0) <= s_axi_wdata(7 downto 0);
                end if;
    
                if s_axi_wstrb(1) = '1' then
                    dev_types(axi_dev_id)(15 downto 8) <= s_axi_wdata(15 downto 8);
                end if;
            else
                perph_reg_in <= peripheral_out(axi_dev_id).reg_out;
                if s_axi_wstrb(0) = '1' then
                    perph_reg_in(7 downto 0) <= s_axi_wdata(7 downto 0);
                end if;
    
                if s_axi_wstrb(1) = '1' then
                    perph_reg_in(15 downto 8) <= s_axi_wdata(15 downto 8);
                end if;
                perph_reg_write(axi_dev_id) <= '1';
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
        state <= IDLE;
        dev_types <= (others => (others => '0'));
    end if;
end process;

end Behavioral;
