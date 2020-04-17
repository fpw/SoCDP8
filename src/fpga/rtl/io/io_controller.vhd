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
        C_S_AXI_ADDR_WIDTH: integer := 13;
        num_uarts: natural := 2
    );
    port (
        -- AXI
        S_AXI_ACLK: in std_logic;
        S_AXI_ARESETN: in std_logic;
        
        --- Read address channel: Master initiates read transaction
        S_AXI_ARADDR: in std_logic_vector(C_S_AXI_ADDR_WIDTH - 1 downto 0);
        S_AXI_ARVALID: in std_logic;
        S_AXI_ARREADY: out std_logic; 
        S_AXI_ARPROT: in std_logic_vector(2 downto 0);

        --- Read data channel: Slave outputs data
        S_AXI_RDATA: out std_logic_vector(31 downto 0);
        S_AXI_RVALID: out std_logic;
        S_AXI_RREADY: in std_logic;
        S_AXI_RRESP: out std_logic_vector(1 downto 0); -- 00 := OKAY, 10 := RETRY

        --- Write address channel: Master initiates write transaction
        S_AXI_AWADDR: in std_logic_vector(C_S_AXI_ADDR_WIDTH - 1 downto 0);
        S_AXI_AWVALID: in std_logic;
        S_AXI_AWREADY: out std_logic;
        S_AXI_AWPROT: in std_logic_vector(2 downto 0);
        
        --- Write data channel: Master writes data
        S_AXI_WDATA: in std_logic_vector(31 downto 0);
        S_AXI_WVALID: in std_logic;
        S_AXI_WREADY: out std_logic;
        S_AXI_WSTRB: in std_logic_vector(3 downto 0); -- byte select
        
        --- Write acknowledge channel: Slave acknowledges receipt
        S_AXI_BVALID: out std_logic;
        S_AXI_BREADY: in std_logic;
        S_AXI_BRESP: out std_logic_vector(1 downto 0); -- 00 := OKAY, 10 := RETRY

        -- PDP-8 configuration output
        conf_enable_eae: out std_logic;
        conf_enable_kt8i: out std_logic;
        conf_max_field: out std_logic_vector(2 downto 0);

        -- I/O connections to PDP-8
        iop: in std_logic_vector(2 downto 0);
        io_ac: in std_logic_vector(11 downto 0);
        io_mb: in std_logic_vector(11 downto 0);
        io_bus_out: out std_logic_vector(11 downto 0);
        io_ac_clear: out std_logic;
        io_skip: out std_logic;
        
        -- Data break connections to PDP-8
        brk_rqst: out std_logic;
        brk_three_cycle: out std_logic;
        brk_ca_inc: out std_logic;
        brk_mb_inc: out std_logic;
        brk_data_in: out std_logic;
        brk_data_add: out std_logic_vector(11 downto 0);
        brk_data_ext: out std_logic_vector(2 downto 0);
        brk_data: out std_logic_vector(11 downto 0);
        brk_wc_overflow: in std_logic;
        brk_ack: in std_logic;
        brk_done: in std_logic;
        
        -- UARTs
        uart_rx: in std_logic_vector(num_uarts - 1 downto 0);
        uart_tx: out std_logic_vector(num_uarts - 1 downto 0);
        uart_rts: in std_logic_vector(num_uarts - 1 downto 0);
        uart_cts: out std_logic_vector(num_uarts - 1 downto 0);
        
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
    signal axi_in_table: std_logic;
    signal axi_bus_id: integer range 0 to 63;
    signal axi_dev_reg: integer range 0 to 15;

    signal enable_eae: std_logic;
    signal enable_kt8i: std_logic;
    signal max_mem_field: std_logic_vector(2 downto 0);

    type bus_to_dev_a is array(0 to 63) of integer range 0 to DEV_ID_COUNT - 1;
    signal bus_to_dev: bus_to_dev_a;
    
    signal perph_reg_sel: std_logic_vector(3 downto 0);
    signal perph_reg_in: std_logic_vector(15 downto 0);
    signal perph_reg_write: std_logic_vector(DEV_ID_COUNT - 1 downto 0);
    
    signal iop_code: io_state;
    signal cur_bus_id: integer range 0 to 63;
    signal cur_dev_id: integer range 0 to DEV_ID_COUNT - 1;

    signal dev_enable: std_logic_vector(DEV_ID_COUNT - 1 downto 0);
    signal dev_interrupts: std_logic_vector(DEV_ID_COUNT - 1 downto 0);
    signal dev_attention: std_logic_vector(DEV_ID_COUNT - 1 downto 0);

    type peripheral_out_rec is record
        io_skip: std_logic;
        io_ac_clear: std_logic;
        io_bus_out: std_logic_vector(11 downto 0);
        reg_out: std_logic_vector(15 downto 0);
    end record;
    type peripheral_out_a is array(0 to DEV_ID_COUNT - 1) of peripheral_out_rec;
    
    signal peripheral_out: peripheral_out_a;
    
    -- data break
    signal bk_rqst: std_logic;
    signal bk_three_cycle: std_logic;
    signal bk_ca_inc: std_logic;
    signal bk_mb_inc: std_logic;
    signal bk_data_in: std_logic;
    signal bk_data_add: std_logic_vector(11 downto 0);
    signal bk_data_ext: std_logic_vector(2 downto 0);
    signal bk_data: std_logic_vector(11 downto 0);
    signal bk_ready: std_logic; 
    
    signal bk_mb: std_logic_vector(11 downto 0);
    signal bk_wc_ovf: std_logic;
begin

brk_rqst <= bk_rqst;
brk_three_cycle <= bk_three_cycle;
brk_ca_inc <= bk_ca_inc;
brk_mb_inc <= bk_mb_inc;
brk_data_in <= bk_data_in;
brk_data_add <= bk_data_add;
brk_data_ext <= bk_data_ext;
brk_data <= bk_data; 

iop_code <= IO1 when iop(0) = '1' else
            IO2 when iop(1) = '1' else
            IO4 when iop(2) = '1' else
            IO_NONE;

pt08_inst: entity work.pt08
    generic map(
        bus_addr => o"03"
    )
    port map(
        clk => S_AXI_ACLK,
        rstn => S_AXI_ARESETN,
        
        reg_sel => perph_reg_sel,
        reg_out => peripheral_out(DEV_ID_PT08).reg_out,
        reg_in => perph_reg_in,
        reg_write => perph_reg_write(DEV_ID_PT08),
        
        enable => dev_enable(DEV_ID_PT08),
        iop => iop_code,
        io_mb => io_mb,
        io_ac => io_ac,
        
        io_skip => peripheral_out(DEV_ID_PT08).io_skip,
        io_ac_clear => peripheral_out(DEV_ID_PT08).io_ac_clear,
        io_bus_out => peripheral_out(DEV_ID_PT08).io_bus_out,
        
        uart_rx => uart_rx(0),
        uart_tx => uart_tx(0),
        uart_rts => uart_rts(0),
        uart_cts => uart_cts(0),
        
        pdp8_irq => dev_interrupts(DEV_ID_PT08),
        soc_attention => dev_attention(DEV_ID_PT08)
    );

tt_insts: for i in 0 to 3 generate
    tt_inst: entity work.pt08
        generic map(
            bus_addr => o"40" + 2 * i
        )
        port map(
            clk => S_AXI_ACLK,
            rstn => S_AXI_ARESETN,
            
            reg_sel => perph_reg_sel,
            reg_out => peripheral_out(DEV_ID_TT1 + i).reg_out,
            reg_in => perph_reg_in,
            reg_write => perph_reg_write(DEV_ID_TT1 + i),
            
            enable => dev_enable(DEV_ID_TT1 + i),
            iop => iop_code,
            io_mb => io_mb,
            io_ac => io_ac,
            
            io_skip => peripheral_out(DEV_ID_TT1 + i).io_skip,
            io_ac_clear => peripheral_out(DEV_ID_TT1 + i).io_ac_clear,
            io_bus_out => peripheral_out(DEV_ID_TT1 + i).io_bus_out,

            uart_rx => '1',
            uart_tx => open,
            uart_rts => '1',
            uart_cts => open,
                
            pdp8_irq => dev_interrupts(DEV_ID_TT1 + i),
            soc_attention => dev_attention(DEV_ID_TT1 + i)
        );
end generate;

pc04_inst: entity work.pc04
    port map(
        clk => S_AXI_ACLK,
        rstn => S_AXI_ARESETN,
        
        reg_sel => perph_reg_sel,
        reg_out => peripheral_out(DEV_ID_PC04).reg_out,
        reg_in => perph_reg_in,
        reg_write => perph_reg_write(DEV_ID_PC04),
        
        enable => dev_enable(DEV_ID_PC04),
        iop => iop_code,
        io_mb => io_mb,
        io_ac => io_ac,

        uart_rx => uart_rx(1),
        uart_tx => uart_tx(1),
        uart_rts => uart_rts(1),
        uart_cts => uart_cts(1),
        
        io_skip => peripheral_out(DEV_ID_PC04).io_skip,
        io_ac_clear => peripheral_out(DEV_ID_PC04).io_ac_clear,
        io_bus_out => peripheral_out(DEV_ID_PC04).io_bus_out,
        
        pdp8_irq => dev_interrupts(DEV_ID_PC04),
        soc_attention => dev_attention(DEV_ID_PC04)
    );

tc08_inst: entity work.tc08
    port map(
        clk => S_AXI_ACLK,
        rstn => S_AXI_ARESETN,
        
        reg_sel => perph_reg_sel,
        reg_out => peripheral_out(DEV_ID_TC08).reg_out,
        reg_in => perph_reg_in,
        reg_write => perph_reg_write(DEV_ID_TC08),
        
        enable => dev_enable(DEV_ID_TC08),
        iop => iop_code,
        io_mb => io_mb,
        io_ac => io_ac,
        
        io_skip => peripheral_out(DEV_ID_TC08).io_skip,
        io_ac_clear => peripheral_out(DEV_ID_TC08).io_ac_clear,
        io_bus_out => peripheral_out(DEV_ID_TC08).io_bus_out,
        
        pdp8_irq => dev_interrupts(DEV_ID_TC08),
        soc_attention => dev_attention(DEV_ID_TC08)
    );

rf08_inst: entity work.rf08
    port map(
        clk => S_AXI_ACLK,
        rstn => S_AXI_ARESETN,
        
        reg_sel => perph_reg_sel,
        reg_out => peripheral_out(DEV_ID_RF08).reg_out,
        reg_in => perph_reg_in,
        reg_write => perph_reg_write(DEV_ID_RF08),
        
        enable => dev_enable(DEV_ID_RF08),
        iop => iop_code,
        io_mb => io_mb,
        io_ac => io_ac,
        
        io_skip => peripheral_out(DEV_ID_RF08).io_skip,
        io_ac_clear => peripheral_out(DEV_ID_RF08).io_ac_clear,
        io_bus_out => peripheral_out(DEV_ID_RF08).io_bus_out,
        
        pdp8_irq => dev_interrupts(DEV_ID_RF08),
        soc_attention => dev_attention(DEV_ID_RF08)
    );

df32_inst: entity work.df32
    port map(
        clk => S_AXI_ACLK,
        rstn => S_AXI_ARESETN,
        
        reg_sel => perph_reg_sel,
        reg_out => peripheral_out(DEV_ID_DF32).reg_out,
        reg_in => perph_reg_in,
        reg_write => perph_reg_write(DEV_ID_DF32),
        
        enable => dev_enable(DEV_ID_DF32),
        iop => iop_code,
        io_mb => io_mb,
        io_ac => io_ac,
        
        io_skip => peripheral_out(DEV_ID_DF32).io_skip,
        io_ac_clear => peripheral_out(DEV_ID_DF32).io_ac_clear,
        io_bus_out => peripheral_out(DEV_ID_DF32).io_bus_out,
        
        pdp8_irq => dev_interrupts(DEV_ID_DF32),
        soc_attention => dev_attention(DEV_ID_DF32)
    );

kw8i_inst: entity work.kw8i
    port map(
        clk => S_AXI_ACLK,
        rstn => S_AXI_ARESETN,
        
        reg_sel => perph_reg_sel,
        reg_out => peripheral_out(DEV_ID_KW8I).reg_out,
        reg_in => perph_reg_in,
        reg_write => perph_reg_write(DEV_ID_KW8I),
        
        enable => dev_enable(DEV_ID_KW8I),
        iop => iop_code,
        io_mb => io_mb,
        io_ac => io_ac,
        
        io_skip => peripheral_out(DEV_ID_KW8I).io_skip,
        io_ac_clear => peripheral_out(DEV_ID_KW8I).io_ac_clear,
        io_bus_out => peripheral_out(DEV_ID_KW8I).io_bus_out,
        
        pdp8_irq => dev_interrupts(DEV_ID_KW8I),
        soc_attention => dev_attention(DEV_ID_KW8I)
    );

rk8_inst: entity work.rk8
    port map(
        clk => S_AXI_ACLK,
        rstn => S_AXI_ARESETN,
        
        reg_sel => perph_reg_sel,
        reg_out => peripheral_out(DEV_ID_RK8).reg_out,
        reg_in => perph_reg_in,
        reg_write => perph_reg_write(DEV_ID_RK8),
        
        enable => dev_enable(DEV_ID_RK8),
        iop => iop_code,
        io_mb => io_mb,
        io_ac => io_ac,
        
        io_skip => peripheral_out(DEV_ID_RK8).io_skip,
        io_ac_clear => peripheral_out(DEV_ID_RK8).io_ac_clear,
        io_bus_out => peripheral_out(DEV_ID_RK8).io_bus_out,
        
        pdp8_irq => dev_interrupts(DEV_ID_RK8),
        soc_attention => dev_attention(DEV_ID_RK8)
    );

conf_enable_eae <= enable_eae;
conf_max_field <= max_mem_field;
conf_enable_kt8i <= enable_kt8i;

peripheral_out(0).io_skip <= '0';
peripheral_out(0).io_ac_clear <= '0';
peripheral_out(0).io_bus_out <= (others => '0');
peripheral_out(0).reg_out <= (others => '0');
dev_interrupts(0) <= '0';
dev_attention(0) <= '0';

pdp_irq <= '1' when to_integer(unsigned(dev_interrupts)) /= 0 else '0';
cur_bus_id <= to_integer(unsigned(io_mb(8 downto 3)));
cur_dev_id <= bus_to_dev(cur_bus_id);

io_skip <= peripheral_out(cur_dev_id).io_skip;
io_ac_clear <= peripheral_out(cur_dev_id).io_ac_clear;
io_bus_out <= peripheral_out(cur_dev_id).io_bus_out;

perph_reg_sel <= std_logic_vector(to_unsigned(axi_dev_reg, 4));

-- addr 0 to 63: bus num to dev id
-- addr 64 to 64 + DEV_ID_COUNT: device regs

axi_fsm: process
    function to_dev_id(addr: std_logic_vector(9 downto 0)) return integer is
    begin
        return to_integer(unsigned(addr(9 downto 4)));
    end function;

    function to_dev_reg(addr: std_logic_vector(9 downto 0)) return integer is
    begin
        return to_integer(unsigned(addr(3 downto 0)));
    end function;
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

    if brk_ack = '1' then
        bk_rqst <= '0';
    end if;
    
    if brk_done = '1' then
        bk_ready <= '1';
        bk_wc_ovf <= brk_wc_overflow;
        bk_mb <= io_mb;
    end if;

    case state is
        when IDLE =>
            if s_axi_arvalid = '1' then
                s_axi_arready <= '1';
                axi_in_table <= not s_axi_araddr(12);
                axi_bus_id <= to_dev_id(s_axi_araddr(11 downto 2));
                axi_dev_reg <= to_dev_reg(s_axi_araddr(11 downto 2));
                state <= READ_WAIT;
            elsif s_axi_awvalid = '1' and s_axi_wvalid = '1' then
                s_axi_awready <= '1';
                axi_in_table <= not s_axi_awaddr(12);
                axi_bus_id <= to_dev_id(s_axi_awaddr(11 downto 2));
                axi_dev_reg <= to_dev_reg(s_axi_awaddr(11 downto 2));
                state <= WRITE_WAIT;
            end if;
        when READ_WAIT =>
            state <= READ;
        when READ =>
            -- write answer
            s_axi_rdata <= (others => '0');

            if axi_in_table = '1' then
                if axi_bus_id = 0 then
                    case axi_dev_reg is
                        when 0 =>
                            s_axi_rdata(2 downto 0) <= max_mem_field;
                            s_axi_rdata(3) <= enable_eae;
                            s_axi_rdata(4) <= enable_kt8i;
                        when 1 =>
                            s_axi_rdata(7 downto 0) <= std_logic_vector(to_unsigned(DEV_ID_COUNT, 8));
                        when 2 =>
                            s_axi_rdata(DEV_ID_COUNT - 1 downto 0) <= dev_attention;
                        when 3 =>
                            s_axi_rdata(11 downto 0) <= bk_mb;
                            s_axi_rdata(12) <= bk_wc_ovf;
                            s_axi_rdata(13) <= bk_ready;
                        when 4 =>
                            s_axi_rdata(0) <= bk_ready;
                            s_axi_rdata(1) <= bk_rqst;
                        when others => null;
                    end case;
                else
                    if axi_dev_reg = 0 then
                        s_axi_rdata(7 downto 0) <= std_logic_vector(to_unsigned(bus_to_dev(axi_bus_id), 8));
                    end if;
                end if;
            else
                if axi_dev_reg = 0 then
                    s_axi_rdata(0) <= dev_enable(axi_bus_id);
                else
                    s_axi_rdata(15 downto 0) <= peripheral_out(axi_bus_id).reg_out;
                end if;
            end if;

            s_axi_rresp <= "00";
            s_axi_rvalid <= '1';
            if s_axi_rready = '1' then
                state <= IDLE;
            end if;
        when WRITE_WAIT =>
            if axi_in_table = '1' or axi_bus_id /= cur_dev_id or iop_code = IO_NONE then
                state <= WRITE;
            end if;
        when WRITE =>
            if axi_in_table = '1' then
                if axi_bus_id = 0 then
                    case axi_dev_reg is
                        when 0 =>
                            if s_axi_wstrb(0) = '1' then
                                max_mem_field <= s_axi_wdata(2 downto 0);
                                enable_eae <= s_axi_wdata(3);
                                enable_kt8i <= s_axi_wdata(4);
                            end if;
                        when 3 =>
                            if s_axi_wstrb(0) = '1' then
                                bk_data(7 downto 0) <= s_axi_wdata(7 downto 0);
                            end if;
                            
                            if s_axi_wstrb(1) = '1' then
                                bk_data(11 downto 8) <= s_axi_wdata(11 downto 8);
                                bk_data_add(3 downto 0) <= s_axi_wdata(15 downto 12);
                            end if;
                            
                            if s_axi_wstrb(2) = '1' then
                                bk_data_add(11 downto 4) <= s_axi_wdata(23 downto 16);
                            end if;
                            
                            if s_axi_wstrb(3) = '1' then
                                bk_data_ext <= s_axi_wdata(26 downto 24);
                                bk_data_in <= s_axi_wdata(27);
                                bk_mb_inc <= s_axi_wdata(28);
                                bk_ca_inc <= s_axi_wdata(29);
                                bk_three_cycle <= s_axi_wdata(30);
                            end if;
                        when 4 =>
                            if s_axi_wstrb(0) = '1' then
                                bk_ready <= not s_axi_wdata(0);
                                bk_rqst <= s_axi_wdata(0);
                            end if;
                        when others => null;
                    end case;
                else
                    if s_axi_wstrb(0) = '1' then
                        if axi_dev_reg = 0 then
                            bus_to_dev(axi_bus_id) <= to_integer(unsigned(s_axi_wdata(7 downto 0)));
                        end if;
                    end if;
                end if;
            else
                if axi_dev_reg = 0 then
                    if s_axi_wstrb(0) = '1' then
                        dev_enable(axi_bus_id) <= s_axi_wdata(0);
                    end if;
                else
                    perph_reg_in <= peripheral_out(axi_bus_id).reg_out;
                    if s_axi_wstrb(0) = '1' then
                        perph_reg_in(7 downto 0) <= s_axi_wdata(7 downto 0);
                    end if;
        
                    if s_axi_wstrb(1) = '1' then
                        perph_reg_in(15 downto 8) <= s_axi_wdata(15 downto 8);
                    end if;
                    perph_reg_write(axi_bus_id) <= '1';
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
        state <= IDLE;
        dev_enable <= (others => '0');

        enable_eae <= '0';
        max_mem_field <= "000";

        bk_rqst <= '0';
        bk_three_cycle <= '0';
        bk_ca_inc <= '0';
        bk_mb_inc <= '0';
        bk_data_in <= '0';
        bk_data_add <= (others => '0');
        bk_data_ext <= (others => '0');
        bk_data <= (others => '0');
        
        bk_ready <= '1';
        bk_mb <= (others => '0');
        bk_wc_ovf <= '0';
    end if;
end process;

end Behavioral;
