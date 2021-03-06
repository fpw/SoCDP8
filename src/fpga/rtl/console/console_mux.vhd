-- Part of SoCDP8, Copyright by Folke Will, 2019
-- Licensed under CERN Open Hardware Licence v1.2
-- See HW_LICENSE for details
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

use work.socdp8_package.all;

-- The I/O controller implements an interface between an AXI bus and the PDP-8/I.
entity console_mux is
    generic(
        -- AXI parameters
        C_S_AXI_ADDR_WIDTH: integer := 8
    );
    port (
        -- PDP Connection
        led_data_field_pdp: in std_logic_vector(2 downto 0);
        led_inst_field_pdp: in std_logic_vector(2 downto 0);
        led_pc_pdp: in std_logic_vector(11 downto 0);
        led_mem_addr_pdp: in std_logic_vector(11 downto 0);
        led_mem_buf_pdp: in std_logic_vector(11 downto 0);
        led_link_pdp: in std_logic;
        led_accu_pdp: in std_logic_vector(11 downto 0);
        led_step_counter_pdp: in std_logic_vector(4 downto 0);
        led_mqr_pdp: in std_logic_vector(11 downto 0);
        led_instruction_pdp: in std_logic_vector(7 downto 0);
        led_state_pdp: in std_logic_vector(5 downto 0);
        led_ion_pdp: in std_logic;
        led_pause_pdp: in std_logic;
        led_run_pdp: in std_logic;

        switch_data_field_pdp: out std_logic_vector(2 downto 0);
        switch_inst_field_pdp: out std_logic_vector(2 downto 0);
        switch_swr_pdp: out std_logic_vector(11 downto 0);
        switch_start_pdp: out std_logic;
        switch_load_pdp: out std_logic;
        switch_dep_pdp: out std_logic;
        switch_exam_pdp: out std_logic;
        switch_cont_pdp: out std_logic;
        switch_stop_pdp: out std_logic;
        switch_sing_step_pdp: out std_logic;
        switch_sing_inst_pdp: out std_logic;
    
        -- Console connection
        -- num lamps * log brightness levels
        lamp_brightness_cons: out std_logic_vector(89 * 4 - 1 downto 0);

        switch_data_field_cons: in std_logic_vector(2 downto 0);
        switch_inst_field_cons: in std_logic_vector(2 downto 0);
        switch_swr_cons: in std_logic_vector(11 downto 0);
        switch_start_cons: in std_logic;
        switch_load_cons: in std_logic;
        switch_dep_cons: in std_logic;
        switch_exam_cons: in std_logic;
        switch_cont_cons: in std_logic;
        switch_stop_cons: in std_logic;
        switch_sing_step_cons: in std_logic;
        switch_sing_inst_cons: in std_logic;

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
        S_AXI_BRESP: out std_logic_vector(1 downto 0) -- 00 := OKAY, 10 := RETRY
    );
end console_mux;

architecture Behavioral of console_mux is
    -- AXI
    type axi_cons_state is (IDLE, READ, WRITE, WRITE_ACK);
    signal axi_state: axi_cons_state;
    signal axi_addr: std_logic_vector(C_S_AXI_ADDR_WIDTH - 1 downto 0);
    
    signal led_data_field: std_logic_vector(2 downto 0);
    signal led_inst_field: std_logic_vector(2 downto 0);
    signal led_pc: std_logic_vector(11 downto 0);
    signal led_mem_addr: std_logic_vector(11 downto 0);
    signal led_mem_buf: std_logic_vector(11 downto 0);
    signal led_link: std_logic;
    signal led_accu: std_logic_vector(11 downto 0);
    signal led_step_counter: std_logic_vector(4 downto 0);
    signal led_mqr: std_logic_vector(11 downto 0);
    signal led_instruction: std_logic_vector(7 downto 0);
    signal led_state: std_logic_vector(5 downto 0);
    signal led_ion: std_logic;
    signal led_pause: std_logic;
    signal led_run: std_logic;

    signal switch_data_field: std_logic_vector(2 downto 0);
    signal switch_inst_field: std_logic_vector(2 downto 0);
    signal switch_swr: std_logic_vector(11 downto 0);
    signal switch_start: std_logic;
    signal switch_load: std_logic;
    signal switch_dep: std_logic;
    signal switch_exam: std_logic;
    signal switch_cont: std_logic;
    signal switch_stop: std_logic;
    signal switch_sing_step: std_logic;
    signal switch_sing_inst: std_logic;

    signal override_leds: std_logic;
    signal override_switches: std_logic;
    
    signal lamp_brightness: lamp_brightness_array(0 to 88);
begin

lamps: entity work.lamp
generic map (
    lamp_count => 89
)
port map (
    clk => S_AXI_ACLK,
    rstn => S_AXI_ARESETN,
    
    input(LAMP_DF + 2 downto LAMP_DF)       => led_data_field,
    input(LAMP_IF + 2 downto LAMP_IF)       => led_inst_field,
    input(LAMP_PC + 11 downto LAMP_PC)      => led_pc,
    input(LAMP_MA + 11 downto LAMP_MA)      => led_mem_addr,
    input(LAMP_MB + 11 downto LAMP_MB)      => led_mem_buf,
    input(LAMP_L)                           => led_link,
    input(LAMP_AC + 11 downto LAMP_AC)      => led_accu,
    input(LAMP_SC + 4 downto LAMP_SC)       => led_step_counter,
    input(LAMP_MQR + 11 downto LAMP_MQR)    => led_mqr,
    input(LAMP_IR + 7 downto LAMP_IR)       => led_instruction,
    input(LAMP_STATE + 5 downto LAMP_STATE) => led_state,
    input(LAMP_ION)                         => led_ion,
    input(LAMP_PAUSE)                       => led_pause,
    input(LAMP_RUN)                         => led_run,
    
    brightness => lamp_brightness
);

axi_console: process
    variable lamp_addr: natural range 0 to 127;
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
    
    case axi_state is
        when IDLE =>
            if s_axi_arvalid = '1' then
                s_axi_arready <= '1';
                axi_addr <= s_axi_araddr;
                axi_state <= READ;
            elsif s_axi_awvalid = '1' and s_axi_wvalid = '1' then
                s_axi_awready <= '1';
                axi_addr <= s_axi_awaddr;
                axi_state <= WRITE;
            end if;
        when READ =>
            -- write answer
            s_axi_rdata <= (others => '0');
            case to_integer(unsigned(axi_addr(C_S_AXI_ADDR_WIDTH - 1 downto 2))) is
                when 0 => s_axi_rdata(1 downto 0) <= override_leds & override_switches;
                when 1 => s_axi_rdata(2 downto 0) <= led_data_field_pdp;
                when 2 => s_axi_rdata(2 downto 0) <= led_inst_field_pdp;
                when 3 => s_axi_rdata(11 downto 0) <= led_pc_pdp;
                when 4 => s_axi_rdata(11 downto 0) <= led_mem_addr_pdp;
                when 5 => s_axi_rdata(11 downto 0) <= led_mem_buf_pdp;
                when 6 => s_axi_rdata(0) <= led_link_pdp;
                when 7 => s_axi_rdata(11 downto 0) <= led_accu_pdp;
                when 8 => s_axi_rdata(4 downto 0) <= led_step_counter_pdp;
                when 9 => s_axi_rdata(11 downto 0) <= led_mqr_pdp;
                when 10 => s_axi_rdata(7 downto 0) <= led_instruction_pdp;
                when 11 => s_axi_rdata(5 downto 0) <= led_state_pdp;
                when 12 => s_axi_rdata(0) <= led_ion_pdp;
                when 13 => s_axi_rdata(0) <= led_pause_pdp;
                when 14 => s_axi_rdata(0) <= led_run_pdp;

                when 15 => s_axi_rdata(2 downto 0) <= switch_data_field_cons;
                when 16 => s_axi_rdata(2 downto 0) <= switch_inst_field_cons;
                when 17 => s_axi_rdata(11 downto 0) <= switch_swr_cons;
                when 18 => s_axi_rdata(0) <= switch_start_cons;
                when 19 => s_axi_rdata(0) <= switch_load_cons;
                when 20 => s_axi_rdata(0) <= switch_dep_cons;
                when 21 => s_axi_rdata(0) <= switch_exam_cons;
                when 22 => s_axi_rdata(0) <= switch_cont_cons;
                when 23 => s_axi_rdata(0) <= switch_stop_cons;
                when 24 => s_axi_rdata(0) <= switch_sing_step_cons;
                when 25 => s_axi_rdata(0) <= switch_sing_inst_cons;
                
                when others =>
                    if axi_addr(7) = '1' then
                        -- addr is 32 to 63
                        -- shift to 0 to 31
                        lamp_addr := to_integer(unsigned(axi_addr(C_S_AXI_ADDR_WIDTH - 2 downto 2)));

                        s_axi_rdata(3 downto 0)   <= std_logic_vector(lamp_brightness(lamp_addr * 8 + 0));
                        s_axi_rdata(7 downto 4)   <= std_logic_vector(lamp_brightness(lamp_addr * 8 + 1));
                        s_axi_rdata(11 downto 8)  <= std_logic_vector(lamp_brightness(lamp_addr * 8 + 2));
                        s_axi_rdata(15 downto 12) <= std_logic_vector(lamp_brightness(lamp_addr * 8 + 3));
                        s_axi_rdata(19 downto 16) <= std_logic_vector(lamp_brightness(lamp_addr * 8 + 4));
                        s_axi_rdata(23 downto 20) <= std_logic_vector(lamp_brightness(lamp_addr * 8 + 5));
                        s_axi_rdata(27 downto 24) <= std_logic_vector(lamp_brightness(lamp_addr * 8 + 6));
                        s_axi_rdata(31 downto 28) <= std_logic_vector(lamp_brightness(lamp_addr * 8 + 7));
                    end if;
            end case;
            s_axi_rresp <= "00";
            s_axi_rvalid <= '1';
            if s_axi_rready = '1' then
                axi_state <= IDLE;
            end if;
        when WRITE =>
            if s_axi_wstrb(0) = '1' then
                case to_integer(unsigned(axi_addr(C_S_AXI_ADDR_WIDTH - 1 downto 2))) is
                    when 0 =>
                        override_switches <= s_axi_wdata(0);
                        override_leds <= s_axi_wdata(1);
                    when 1 => led_data_field <= s_axi_wdata(2 downto 0);
                    when 2 => led_inst_field <= s_axi_wdata(2 downto 0);
                    when 3 => led_pc(7 downto 0) <= s_axi_wdata(7 downto 0);
                    when 4 => led_mem_addr(7 downto 0) <= s_axi_wdata(7 downto 0);
                    when 5 => led_mem_buf(7 downto 0) <= s_axi_wdata(7 downto 0);
                    when 6 => led_link <= s_axi_wdata(0);
                    when 7 => led_accu(7 downto 0) <= s_axi_wdata(7 downto 0);
                    when 8 => led_step_counter <= s_axi_wdata(4 downto 0);
                    when 9 => led_mqr(7 downto 0) <= s_axi_wdata(7 downto 0);
                    when 10 => led_instruction <= s_axi_wdata(7 downto 0);
                    when 11 => led_state <= s_axi_wdata(5 downto 0);
                    when 12 => led_ion <= s_axi_wdata(0);
                    when 13 => led_pause <= s_axi_wdata(0);
                    when 14 => led_run <= s_axi_wdata(0);
    
                    when 15 => switch_data_field <= s_axi_wdata(2 downto 0);
                    when 16 => switch_inst_field <= s_axi_wdata(2 downto 0);
                    when 17 => switch_swr(7 downto 0) <= s_axi_wdata(7 downto 0);
                    when 18 => switch_start <= s_axi_wdata(0);
                    when 19 => switch_load <= s_axi_wdata(0);
                    when 20 => switch_dep <= s_axi_wdata(0);
                    when 21 => switch_exam <= s_axi_wdata(0);
                    when 22 => switch_cont <= s_axi_wdata(0);
                    when 23 => switch_stop <= s_axi_wdata(0);
                    when 24 => switch_sing_step <= s_axi_wdata(0);
                    when 25 => switch_sing_inst <= s_axi_wdata(0);
                    when others => null;
                end case;
            end if;
            if s_axi_wstrb(1) = '1' then
                case to_integer(unsigned(axi_addr(C_S_AXI_ADDR_WIDTH - 1 downto 2))) is
                    when 3 => led_pc(11 downto 8) <= s_axi_wdata(11 downto 8);
                    when 4 => led_mem_addr(11 downto 8) <= s_axi_wdata(11 downto 8);
                    when 5 => led_mem_buf(11 downto 8) <= s_axi_wdata(11 downto 8);
                    when 7 => led_accu(11 downto 8) <= s_axi_wdata(11 downto 8);
                    when 9 => led_mqr(11 downto 8) <= s_axi_wdata(11 downto 8);
                    when 17 => switch_swr(11 downto 8) <= s_axi_wdata(11 downto 8);
                    when others => null;
                end case;
            end if;
            s_axi_wready <= '1';
            axi_state <= WRITE_ACK;
        when WRITE_ACK =>
            s_axi_bresp <= "00";
            s_axi_bvalid <= '1';
            if s_axi_bready = '1' then
                axi_state <= IDLE;
            end if;
    end case;
    
    -- Pressing CONT or STOP disables console overrides
    if switch_cont_cons = '1' or switch_stop_cons = '1' then
        override_switches <= '0';
        override_leds <= '0';
    end if;
    
    if override_leds = '0' then
        led_data_field <= led_data_field_pdp;
        led_inst_field <= led_inst_field_pdp;
        led_pc <= led_pc_pdp;
        led_mem_addr <= led_mem_addr_pdp;
        led_mem_buf <= led_mem_buf_pdp;
        led_link <= led_link_pdp;
        led_accu <= led_accu_pdp;
        led_step_counter <= led_step_counter_pdp;
        led_mqr <= led_mqr_pdp;
        led_instruction <= led_instruction_pdp;
        led_state <= led_state_pdp;
        led_ion <= led_ion_pdp;
        led_pause <= led_pause_pdp;
        led_run <= led_run_pdp;
    end if;

    if override_switches = '0' then
        switch_data_field <= switch_data_field_cons;
        switch_inst_field <= switch_inst_field_cons;
        switch_swr <= switch_swr_cons;
        switch_start <= switch_start_cons;
        switch_load <= switch_load_cons;
        switch_dep <= switch_dep_cons;
        switch_exam <= switch_exam_cons;
        switch_cont <= switch_cont_cons;
        switch_stop <= switch_stop_cons;
        switch_sing_step <= switch_sing_step_cons;
        switch_sing_inst <= switch_sing_inst_cons;
    end if;

    if S_AXI_ARESETN = '0' then
        axi_state <= IDLE;
        override_leds <= '0';
        override_switches <= '0';
    end if;
end process;

ldf: for i in 0 to 2 generate
    lamp_brightness_cons((LAMP_DF + i + 1) * 4 - 1 downto (LAMP_DF + i) * 4) <= std_logic_vector(lamp_brightness(LAMP_DF + i));
end generate;

lif: for i in 0 to 2 generate
    lamp_brightness_cons((LAMP_IF + i + 1) * 4 - 1 downto (LAMP_IF + i) * 4) <= std_logic_vector(lamp_brightness(LAMP_IF + i));
end generate;

lpc: for i in 0 to 11 generate
    lamp_brightness_cons((LAMP_PC + i + 1) * 4 - 1downto (LAMP_PC + i) * 4) <= std_logic_vector(lamp_brightness(LAMP_PC + i));
end generate;

lma: for i in 0 to 11 generate
    lamp_brightness_cons((LAMP_MA + i + 1) * 4 - 1 downto (LAMP_MA + i) * 4) <= std_logic_vector(lamp_brightness(LAMP_MA + i));
end generate;

lmb: for i in 0 to 11 generate
    lamp_brightness_cons((LAMP_MB + i + 1) * 4 - 1downto (LAMP_MB + i) * 4) <= std_logic_vector(lamp_brightness(LAMP_MB + i));
end generate;

lamp_brightness_cons((LAMP_L + 1) * 4 - 1 downto LAMP_L * 4) <= std_logic_vector(lamp_brightness(LAMP_L));

lac: for i in 0 to 11 generate
    lamp_brightness_cons((LAMP_AC + i + 1) * 4 - 1 downto (LAMP_AC + i) * 4) <= std_logic_vector(lamp_brightness(LAMP_AC + i));
end generate;

lsc: for i in 0 to 4 generate
    lamp_brightness_cons((LAMP_SC + i + 1) * 4 - 1 downto (LAMP_SC + i) * 4) <= std_logic_vector(lamp_brightness(LAMP_SC + i));
end generate;

lmqr: for i in 0 to 11 generate
    lamp_brightness_cons((LAMP_MQR + i + 1) * 4  - 1downto (LAMP_MQR + i) * 4) <= std_logic_vector(lamp_brightness(LAMP_MQR + i));
end generate;

lir: for i in 0 to 7 generate
    lamp_brightness_cons((LAMP_IR + i + 1) * 4 - 1 downto (LAMP_IR + i) * 4) <= std_logic_vector(lamp_brightness(LAMP_IR + i));
end generate;

lstate: for i in 0 to 5 generate
    lamp_brightness_cons((LAMP_STATE + i + 1) * 4 - 1 downto (LAMP_STATE + i) * 4) <= std_logic_vector(lamp_brightness(LAMP_STATE + i));
end generate;
    
lamp_brightness_cons((LAMP_ION + 1) * 4 - 1 downto LAMP_ION * 4) <= std_logic_vector(lamp_brightness(LAMP_ION));
lamp_brightness_cons((LAMP_PAUSE + 1) * 4 - 1 downto LAMP_PAUSE * 4) <= std_logic_vector(lamp_brightness(LAMP_PAUSE));
lamp_brightness_cons((LAMP_RUN + 1) * 4 - 1 downto LAMP_RUN * 4) <= std_logic_vector(lamp_brightness(LAMP_RUN));

switch_data_field_pdp <= switch_data_field;
switch_inst_field_pdp <= switch_inst_field;
switch_swr_pdp <= switch_swr;
switch_start_pdp <= switch_start;
switch_load_pdp <= switch_load;
switch_dep_pdp <= switch_dep;
switch_exam_pdp <= switch_exam;
switch_cont_pdp <= switch_cont;
switch_stop_pdp <= switch_stop;
switch_sing_step_pdp <= switch_sing_step;
switch_sing_inst_pdp <= switch_sing_inst;

end Behavioral;
